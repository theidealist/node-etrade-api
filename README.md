# E*TRADE API

A Node.js module for the [E*TRADE web services API](https://us.etrade.com/ctnt/dev-portal/getContent?contentUri=V0_Documentation-GettingStarted).

## Usage

All you need to get started with this module is your E*TRADE-supplied consumer key and consumer secret

```javascript
var etrade = require('etrade');

var configuration = 
{
  useSandbox : true|false, // true if not provided
  verboseLogging: true|false, // true if not provided
  key : 'your_key',
  secret : 'your_secret'
}

var et = new etrade(configuration);
```

You now have an etrade client.  Before you can do anything useful, you will need to authenticate yourself with the E*TRADE system, and a user will have to authorize your service to access his/her account data.

### Authorization

Authorization is a painful four step process.  In general it looks like this:

1. Your user logs into your site and you ask E*TRADE to generate a "request token"
2. You redirect your user to E*TRADE's authorization site, where they log in and authorize your application.
3. They are provided with a "verification code" (for example: H92GX) that they must copy and paste back into your site.
4. You provide the verification code back to E*TRADE, and get an "access token" which permits all broader activity.

It looks like this in code:
```javascript
et.getRequestToken(
  function(authorizationUrl) { 
    // Your service requires users, who will need to visit
    // the following URL and, after logging in and 
    // authorizing your service to access their account
    // data, paste the E*TRADE provided verification
    // code back into your application.
    console.log("Please have your client visit " + 
                authorizationUrl + 
                " to authorize your service"); },
  function(error) { 
    console.log("Error encountered while attempting " +
                "to retrieve a request token: " + 
                error); }
);

```

The user should come back to you with their verification code, through some "out-of-band" process (you can, apparently work with E*TRADE to have them redirect your user back to your site if your service is public facing).

```javascript
et.getAccessToken(verificationCode,
  function() {
    // Your app can start using other E*TRADE API now
  },
  function(error) {
    console.log("Error encountered while attempting " +
                "to exchange request token for access token: " +
                error);
  }
);
```
