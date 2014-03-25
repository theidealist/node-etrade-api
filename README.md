# E*TRADE API

A Node.js module for the [E*TRADE web services API](https://us.etrade.com/ctnt/dev-portal/getContent?contentUri=V0_Documentation-GettingStarted).

## Usage

All you need to get started with this module is your E*TRADE-supplied consumer key and consumer secret

```javascript
var etrade = require('etrade');

var configuration = 
{
  useSandbox : true|false, // true if not provided
  key : 'your_key',
  secret : 'your_secret'
}

var et = new etrade(configuration);

et.getRequestToken(
  function(authorizationUrl) { 
    // Your service requires users, who will need to visit
    // the following URL and, after logging in and 
    // authorizing your service to access their account
    // data, paste the E*TRADE provided verification
    // code back into your application.
    console.log("Please have your client visit " + 
                authorizationURL + 
                " to authorize your service"); },
  function(error) { 
    console.log("Error encountered while attempting " +
                "to retrieve a request token: " + 
                error); }
);

// ... more to come

```
