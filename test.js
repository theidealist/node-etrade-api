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
var accounts = [];
var transactions = [];
var alerts = [];
var displayAccountsResult = false;

tests.push(function() { et.listAccounts(next(),getErrorCallbackFor("ListAccounts")); });
if (displayAccountsResult) tests.push(function(accountList) { console.log("AccountList: " + JSON.stringify(accountList)); next()(accountList); });
tests.push(function(accountList) { accounts = accountList["json.accountListResponse"].response; next()(); });
tests.push(function(account) { et.getAccountBalance(accounts[0].accountId,next(),getErrorCallbackFor("GetAccountBalance")); });
if (displayAccountsResult) tests.push(function(balance) { console.log("AccountBalance: " + JSON.stringify(balance)); next()(balance);});
tests.push(function() { et.getAccountPositions({accountId:accounts[0].accountId },next(),getErrorCallbackFor("GetAccountPositions")); });
if (displayAccountsResult) tests.push(function(positions) { console.log("Positions[" + accounts[0].accountId + "]: " + JSON.stringify(positions)); next()(); });
tests.push(function() { et.getAccountPositions({accountId:accounts[1].accountId },next(),getErrorCallbackFor("GetAccountPositions")); });
if (displayAccountsResult) tests.push(function(positions) { console.log("Positions[" + accounts[1].accountId + "]: " + JSON.stringify(positions)); next()(); });
tests.push(function() { et.getTransactionHistory({accountId:accounts[0].accountId },next(),getErrorCallbackFor("GetTransactionHistory")); });
if (displayAccountsResult) tests.push(function(history) { console.log("TransactionHistory: " + JSON.stringify(history)); next()(history); });
tests.push(function(history) { transactions = history["json.transactions"].transactionList; next()(); });
tests.push(function() { et.getTransactionDetails({accountId:accounts[0].accountId, transactionId:transactions[0].transactionId},
                         next(),getErrorCallbackFor("GetTransactionDetails")); });
if (displayAccountsResult) tests.push(function(transaction) { console.log("Transaction: " + JSON.stringify(transaction)); next()(); });
tests.push(function() { et.listAlerts(next(),getErrorCallbackFor("ListAlerts")); });
if (displayAccountsResult) tests.push(function(alertList) { console.log("AlertList: " + JSON.stringify(alertList)); next()(alertList); });
tests.push(function(alertList) { alerts = alertList["json.getAlertsResponse"].response; next()(); });
tests.push(function() { et.getAlert(alerts[0].alertId,next(),getErrorCallbackFor("GetAlert")); });
if (displayAccountsResult) tests.push(function(alert) { console.log("Alert: " + JSON.stringify(alert)); next()(); });

// Note: deleteAlerts is currently failing.  I think it has to do with using DELETE HTTP verb
//       figure out later!
//tests.push(function() { et.deleteAlert(alerts[0].alertId,next(),getErrorCallbackFor("DeleteAlert")); });
//tests.push(function(deleteResponse) { console.log("DeleteResult: " + JSON.stringify(deleteResponse)); next()(); });

tests.push(function() { next()(); });

// Order module
var orders = [];
tests.push(function() { et.listOrders(accounts[0].accountId,next(),getErrorCallbackFor("ListOrders")); });
tests.push(function(orderList) { console.log("OrderList: " + JSON.stringify(orderList)); next()(orderList); });
tests.push(function(orderList) { next()(); });


// Close up shop
tests.push(function() { et.revokeAccessToken(next(),getErrorCallbackFor("RevokeAccessToken")); });
tests.push(function() { console.log("Token revoked."); next()(); });
tests.push(function() { console.log("Tests Completed Successfully"); process.exit(0); });

// Kick it!
next()();
