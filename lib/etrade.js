var crypto = require('crypto');
var oauth_sign = require('oauth-sign');
var querystring = require('querystring');
var request = require('request');

module.exports = exports = function(options)
{
    // Options
    // {
    //      "useSandbox" : true | false, // default is true
    //      "key" : key,
    //      "secret" : secret
    // }

    if (arguments.length != 1 || typeof options != "object")
        throw Error("The etrade module requires an options block object parameter");
    if (!options.hasOwnProperty("key"))
        throw Error("The etrade module requires specification of an API key");
    if (!options.hasOwnProperty("secret"))
        throw Error("The etrade module requires specification of an API secret");
    if (!options.hasOwnProperty("useSandbox"))
        options.useSandbox = true;

    var configurations = 
    {
            "base" : {
                "oauth" : {
                    "host" : "etws.etrade.com",
                    "token" : "",
                    "secret" : "",
                    "code" : "",
                    "request_token" : "",
                    "access_token" : "",
                    "access_token_secret" : ""
                },
                "authorize" : {
                    "host" : "us.etrade.com",
                    "path" : "/e/t/etws/authorize",
                    "login": "/home",
                },
                "pushURL" : "https://etwspushsb.etrade.com/apistream/cometd/oauth/",
                "getHostname" : function(module) {
                    return module == "oauth" ? this.oauth.host : this.host;
                }
            },
            "production" : {
                "host" : "etws.etrade.com",
                "buildPath" : function(module,action) {
                    return "/" + module + "/rest/" + action + (module == "oauth" ? "" : ".json");
                }
            },
            "sandbox" : {
                "host" : "etwssandbox.etrade.com",
                "buildPath" : function(module,action) {
                    return "/" + module + (module == "oauth" ? "/" : "/sandbox/rest/") +
                    action + (module == "oauth" ? "" : ".json");
                }
            },
    };

    this.configuration = configurations.base;

    if (options.useSandbox)
    {
        for (var attrname in configurations.sandbox)
        {
            this.configuration[attrname] = configurations.sandbox[attrname];
        }
    }
    else
    {
        for (var attrname in configurations.production)
        {
            this.configuration[attrname] = configurations.production[attrname];
        }
    }

    this.configuration.key = options.key;
    this.configuration.secret = options.secret;
};

exports.prototype.getRequestToken = function(successCallback,errorCallback)
{
    // One of successCallback or errorCallback is invoked
    // successCallback is invoked with the redirection address
    //
    // errorCallback is invoked with an error message indicating the 
    // failure, if any
    if (arguments.length != 2)
        errorCallback("Invalid invocation of etrade::getRequestToken(): Two arguments are required");
    else if (typeof(successCallback) != "function" ||
              typeof(errorCallback) != "function")
        errorCallback("Invalid invocation of etrade::getRequestToken(): One or more arguments are not functions");

    //
    // From the etrade dev portal at 
    // https://us.etrade.com/ctnt/dev-portal/getDetail?contentUri=V0_Documentation-AuthorizationAPI-GetRequestToken
    //
    // oauth_consumer_key 	string 	The value used by the consumer to identify itself to the service provider.
    // oauth_timestamp 	integer 	The date and time of the request, in epoch time. Must be accurate within five minutes.
    // oauth_nonce 	string 	A nonce, as described in the authorization guide - roughly, an arbitrary or random value that cannot be used again with the same timestamp.
    // oauth_signature_method 	string 	The signature method used by the consumer to sign the request. The only supported value is "HMAC-SHA1".
    // oauth_signature 	string 	Signature generated with the shared secret and token secret using the specified oauth_signature_method, as described in OAuth documentation.
    // oauth_callback 	string 	Callback information, as described elsewhere. Must always be set to "oob", whether using a callback or not.
    //

    var method = "GET";
    var ts = new Date();
    var module = "oauth";
    var action = "request_token";
    var useJSON = false;           // For some reason, JSON is not supported here?

    var requestOptions = this._getRequestOptions(method,ts,module,action,useJSON);

    // Add this call's query parameters
    requestOptions.qs.oauth_callback = "oob";

    // Sign the request
    var oauth_signature = oauth_sign.hmacsign(requestOptions.method,requestOptions.url,
                                              requestOptions.qs,this.configuration.secret);
    // Add the signature to the request
    requestOptions.qs.oauth_signature = oauth_signature;
    
    // Make the request
    //console.log("Request: " + requestOptions.url);
    request(requestOptions,function(error,message,body)
    {
        if (error) 
        { 
            console.error("Error received in etrade::getRequestToken(): " + error); 
            errorCallback(error); 
        }
        else 
        { 
            var response = this._parseBody(message.headers["content-type"],body);

            this.configuration.oauth.request_token = response.oauth_token;
            this.configuration.oauth.request_token_secret = response.oauth_token_secret;

            // https://us.etrade.com/e/t/etws/authorize?key={oauth_consumer_key}&token={oauth_token}
            var url = "https://us.etrade.com/e/t/etws/authorize?" +
                       querystring.stringify({key:this.configuration.key, token:response.oauth_token});
            
            successCallback(url); 
        }
    }.bind(this));
};

exports.prototype.getAccessToken = function(verificationCode,successCallback,errorCallback)
{
    // One of successCallback or errorCallback is invoked
    // successCallback is invoked with the consumer's access token, followed
    // by the token secret, successCallback(token,secret)
    //
    // errorCallback is invoked with an error message indicating the failure
    if (arguments.length != 3)
        errorCallback("Invalid invocation of etrade::getAccessToken(): Three arguments are required");
    else if (typeof(successCallback) != "function" ||
              typeof(errorCallback) != "function")
        errorCallback("Invalid invocation of etrade::getAccessToken(): One or more callbacks are not function objects");
        
    //
    // From the etrade dev portal at 
    // https://us.etrade.com/ctnt/dev-portal/getDetail?contentUri=V0_Documentation-AuthorizationAPI-GetAccessToken
    // oauth_consumer_key	string	Required	The value used by the consumer to identify itself to the service provider.
    // oauth_timestamp	integer	Required	The date and time of the request, in epoch time. Must be accurate to within five minutes.
    // oauth_nonce	string	Required	A nonce, as described in the authorization guide - roughly, an arbitrary or random value that cannot be used again with the same timestamp.
    // oauth_signature_method	string	Required	The signature method used by the consumer to sign the request. The only supported value is "HMAC-SHA1".
    // oauth_signature	string	Required	Signature generated with the shared secret and token secret using the specified oauth_signature_method, as described in OAuth documentation.
    // oauth_token	string	Required	The consumer’s request token to be exchanged for an access token.
    // oauth_verifier	string	Required	The code received by the user to authenticate with the third-party application.
    //
    
    var method = "GET";
    var ts = new Date();
    var module = "oauth";
    var action = "access_token";
    var useJSON = false;           // For some reason, JSON is not supported here?

    var requestOptions = this._getRequestOptions(method,ts,module,action,useJSON);

    // Add this call's query parameters
    requestOptions.qs.oauth_token = this.configuration.oauth.request_token;
    requestOptions.qs.oauth_verifier = verificationCode;

    // Sign the request
    var oauth_signature = oauth_sign.hmacsign(requestOptions.method,requestOptions.url,
                                              requestOptions.qs,
                                              this.configuration.secret,
                                              this.configuration.oauth.request_token_secret);
    
    // Add the signature to the request
    requestOptions.qs.oauth_signature = oauth_signature;

    // Make the request
    //console.log("Request: " + requestOptions.url);
    request(requestOptions,function(error,message,body)
    {
        if (error)
        {
            errorCallback(error);
        }
        else
        {
            var response = this._parseBody(message.headers["content-type"],body);

            this.configuration.oauth.access_token = response.oauth_token;
            this.configuration.oauth.access_token_secret = response.oauth_token_secret;
            successCallback(response.oauth_token,response.oauth_token_secret);
        }
    }.bind(this));
};

exports.prototype.renewAccessToken = function(successCallback,errorCallback)
{
    // One of successCallback or errorCallback is invoked
    // successCallback is invoked with no arguments on success
    //
    // errorCallback is invoked with an error message indicating the 
    // failure, if any
    if (arguments.length != 2)
        errorCallback("Invalid invocation of etrade::renewAccessToken(): Two arguments are required");
    else if (typeof(successCallback) != "function" ||
              typeof(errorCallback) != "function")
        errorCallback("Invalid invocation of etrade::renewAccessToken(): One or more arguments are not functions");

    //
    // From the etrade dev portal at 
    // https://us.etrade.com/ctnt/dev-portal/getDetail?contentUri=V0_Documentation-AuthorizationAPI-RenewAccessToken
    // oauth_consumer_key  string  Required    The value used by the consumer to identify itself to the service provider.
    // oauth_timestamp     integer     Required    The date and time of the request, in epoch time. Must be accurate within five minutes.
    // oauth_nonce     string  Required    A nonce, as described in the authorization guide - roughly, an arbitrary or random value that cannot be used again with the same timestamp.
    // oauth_signature_method  string  Required    The signature method used by the consumer to sign the request. The only supported value is "HMAC-SHA1".
    // oauth_signature     string  Required    Signature generated with the shared secret and token secret using the specified oauth_signature_method, as described in OAuth documentation.
    // oauth_token     string  Required    The consumer's request [Access???] token to be exchanged for an access token.
    
    var method = "GET";
    var ts = new Date();
    var module = "oauth";
    var action = "renew_access_token";
    var useJSON = false;           // For some reason, JSON is not supported here?

    var requestOptions = this._getRequestOptions(method,ts,module,action,useJSON);

    // Add this call's query parameters
    requestOptions.qs.oauth_token = this.configuration.oauth.access_token;

    // Sign the request
    var oauth_signature = oauth_sign.hmacsign(requestOptions.method,requestOptions.url,
                                              requestOptions.qs,
                                              this.configuration.secret,
                                              this.configuration.oauth.access_token_secret);
    
    // Add the signature to the request
    requestOptions.qs.oauth_signature = oauth_signature;

    // Make the request
    //console.log("Request: " + requestOptions.url);
    request(requestOptions,function(error,message,body)
    {
        if (error)
        {
            errorCallback(error);
        }
        else
        {
            var response = this._parseBody(message.headers["content-type"],body);
            successCallback();
        }
    }.bind(this));
};

exports.prototype.revokeAccessToken = function(successCallback,errorCallback)
{
    // One of successCallback or errorCallback is invoked
    // successCallback is invoked with no arguments on success
    //
    // errorCallback is invoked with an error message indicating the 
    // failure, if any
    if (arguments.length != 2)
        errorCallback("Invalid invocation of etrade::revokeAccessToken(): Two arguments are required");
    else if (typeof(successCallback) != "function" ||
              typeof(errorCallback) != "function")
        errorCallback("Invalid invocation of etrade::revokeAccessToken(): One or more arguments are not functions");

    //
    // From the etrade dev portal at 
    // https://us.etrade.com/ctnt/dev-portal/getDetail?contentUri=V0_Documentation-AuthorizationAPI-RevokeAccessToken
    // oauth_consumer_key  string  Required    The value used by the consumer to identify itself to the service provider.
    // oauth_timestamp     integer     Required    The date and time of the request, in epoch time. Must be accurate within five minutes.
    // oauth_nonce     string  Required    A nonce, as described in the authorization guide - roughly, an arbitrary or random value that cannot be used again with the same timestamp.
    // oauth_signature_method  string  Required    The signature method used by the consumer to sign the request. The only supported value is "HMAC-SHA1".
    // oauth_signature     string  Required    Signature generated with the shared secret and token secret using the specified oauth_signature_method, as described in OAuth documentation.
    // oauth_token     string  Required    The consumer’s access token to be revoked.
    
    var method = "GET";
    var ts = new Date();
    var module = "oauth";
    var action = "revoke_access_token";
    var useJSON = false;           // For some reason, JSON is not supported here?

    var requestOptions = this._getRequestOptions(method,ts,module,action,useJSON);

    // Add this call's query parameters
    requestOptions.qs.oauth_token = this.configuration.oauth.access_token;

    // Sign the request
    var oauth_signature = oauth_sign.hmacsign(requestOptions.method,requestOptions.url,
                                              requestOptions.qs,
                                              this.configuration.secret,
                                              this.configuration.oauth.access_token_secret);
    
    // Add the signature to the request
    requestOptions.qs.oauth_signature = oauth_signature;

    // Make the request
    //console.log("Request: " + requestOptions.url);
    request(requestOptions,function(error,message,body)
    {
        if (error)
        {
            errorCallback(error);
        }
        else
        {
            var response = this._parseBody(message.headers["content-type"],body);
            successCallback();
        }
    }.bind(this));
};

exports.prototype._getRequestOptions = function(method, timeStamp, module, action, useJSON)
{
    return {
        url : "https://" + this.configuration.getHostname(module) +
              this.configuration.buildPath(module,action) + 
              (useJSON ? ".json" : ""),
        method : method,
        qs : {
            oauth_consumer_key : this.configuration.key,
            oauth_nonce : this._generateNonceFor(timeStamp),
            oauth_signature_method : "HMAC-SHA1",
            oauth_timestamp : Math.floor(timeStamp.getTime()/1000),
            oauth_version : "1.0" // Yes, needs to be a string (otherwise gets truncated)  
        },

    };
};

exports.prototype._generateNonceFor = function(timeStamp)
{
    var msSinceEpoch = timeStamp.getTime();

    var secondsSinceEpoch = Math.floor(msSinceEpoch / 1000.0);
    var msSinceSecond = (msSinceEpoch - (secondsSinceEpoch*1000)) / 1000.0;

    var maxRand = 2147483647.0;  // This constant comes from PHP, IIRC
    var rand = Math.round(Math.random() * maxRand);

    var microtimeString = "" + msSinceSecond + "00000 " + secondsSinceEpoch;   
    var nonce = microtimeString + rand;

    var md5Hash = crypto.createHash('md5');    
    md5Hash.update(nonce);
    return md5Hash.digest('hex');
};

exports.prototype._parseBody = function(contentType,body)
{
    var contentTypes = {
            "application/x-www-form-urlencoded" : function(body)
            {
                return querystring.parse(body);
            },
            "application/json" : function(body)
            {
                return JSON.parse(body);
            }
    };
    contentType = contentType.split(";")[0];

    if (typeof(contentTypes[contentType]) == 'function')
    {
        return contentTypes[contentType](body);
    }
    else
    {
        throw "Unrecognized content type: " + contentType;
    }
};
