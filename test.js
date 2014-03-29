var etrade = require('./index');
var options = require('./test-keys.js'); // Uncommited file.  It has valid E*TRADE keys that are not shareable

var readline = require('readline');


var et = new etrade(options);

var rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function errorCallback(errorLevel,error)
{
    console.error("Error in '" + errorLevel + "': " + error);
    process.exit(-1);
}

function getErrorCallbackFor(errorLevel)
{
    return function(error) { return errorCallback(errorLevel,error); };
}

tests = [];
var next = function() { return tests.shift(); };

// Authorization module
tests.push(function() { et.getRequestToken(next(),getErrorCallbackFor("GetRequestToken")); });
tests.push(function(url) { console.log("Authorize at: " + url); next()(); });
tests.push(function() { rl.question("Verification Code? ",next()); });
tests.push(function(verifier) { et.getAccessToken(verifier,next(),getErrorCallbackFor("GetAccessToken")); });
tests.push(function() { console.log("Got an access token"); next()(); });
tests.push(function() { et.renewAccessToken(next(),getErrorCallbackFor("RenewAccessToken")); });
tests.push(function() { console.log("Renewed access token"); next()(); });

// Accounts module
tests.push(function() { et.listAccounts(next(),getErrorCallbackFor("ListAccounts")); });
tests.push(function(accountList) { console.log("AccountList: " + JSON.stringify(accountList)); next()(); });

// Close up shop
tests.push(function() { et.revokeAccessToken(next(),getErrorCallbackFor("RevokeAccessToken")); });
tests.push(function() { console.log("Token revoked."); next()(); });
tests.push(function() { console.log("Tests Completed Successfully"); process.exit(0); });

// Kick it!
next()();
