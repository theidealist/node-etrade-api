var crypto = require('crypto');
var oauth_sign = require('oauth-sign');
var querystring = require('querystring');
var request = require('request');

var authorization = require('./authorization.js');

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
    this.authorized = false;
    
    this.crypto = crypto;
    this.oauth_sign = oauth_sign;
    this.querystring = querystring;
    this.request = request;
};

// Import authorization functions
for (var funcName in authorization) { exports.prototype[funcName] = authorization[funcName]; }

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
