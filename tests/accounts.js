// Tests for the accounts module

var runTests = false;
var displayResults = false;

var t = [];         // An array of test functions
var m = [];         // An array of mandatory test functions (usually later tests depend on these)
var accounts = [];  // A list of accounts

exports.registerTests = function(th)
{
    th.tests = th.tests.concat(runTests ? t : m);
};

// list accounts
t.push(function() { this.et.listAccounts(this.next(),this.getErrorCallbackFor("ListAccounts")); });
if (displayResults) t.push(function(accountList) { console.log("AccountList: " + JSON.stringify(accountList,null,2)); this.next()(accountList); });
t.push(function(accountList) { this.shared.accounts = accounts = accountList["json.accountListResponse"].response; this.next()(); });

// account balance
t.push(function(account) { this.et.getAccountBalance(accounts[0].accountId,this.next(),this.getErrorCallbackFor("GetAccountBalance")); });
if (displayResults) t.push(function(balance) { console.log("AccountBalance: " + JSON.stringify(balance,null,2)); this.next()(balance);});

// account positions
t.push(function() { this.et.getAccountPositions({accountId:accounts[0].accountId },this.next(),this.getErrorCallbackFor("GetAccountPositions")); });
if (displayResults) t.push(function(positions) { console.log("Positions[" + accounts[0].accountId + "]: " + JSON.stringify(positions,null,2)); this.next()(); });
t.push(function() { this.et.getAccountPositions({accountId:accounts[1].accountId },this.next(),this.getErrorCallbackFor("GetAccountPositions")); });
if (displayResults) t.push(function(positions) { console.log("Positions[" + accounts[1].accountId + "]: " + JSON.stringify(positions,null,2)); this.next()(); });

// transaction history
t.push(function() { this.et.getTransactionHistory({accountId:accounts[0].accountId },this.next(),this.getErrorCallbackFor("GetTransactionHistory")); });
if (displayResults) t.push(function(history) { console.log("TransactionHistory: " + JSON.stringify(history,null,2)); this.next()(history); });
t.push(function(history) { transactions = history["json.transactions"].transactionList; this.next()(); });

// transaction details
t.push(function() { this.et.getTransactionDetails({accountId:accounts[0].accountId, transactionId:transactions[0].transactionId},
                         this.next(),this.getErrorCallbackFor("GetTransactionDetails")); });
if (displayResults) t.push(function(transaction) { console.log("Transaction: " + JSON.stringify(transaction,null,2)); this.next()(); });

//list alerts
t.push(function() { this.et.listAlerts(this.next(),this.getErrorCallbackFor("ListAlerts")); });
if (displayResults) t.push(function(alertList) { console.log("AlertList: " + JSON.stringify(alertList,null,2)); this.next()(alertList); });
t.push(function(alertList) { alerts = alertList["json.getAlertsResponse"].response; this.next()(); });

// get alert
t.push(function() { this.et.getAlert(alerts[0].alertId,this.next(),this.getErrorCallbackFor("GetAlert")); });
if (displayResults) t.push(function(alert) { console.log("Alert: " + JSON.stringify(alert,null,2)); this.next()(); });

// delete alert
t.push(function() { this.et.deleteAlert(alerts[0].alertId,this.next(),this.getErrorCallbackFor("DeleteAlert")); });
if (displayResults) t.push(function(deleteResponse) { console.log("DeleteResult: " + JSON.stringify(deleteResponse,null,2)); this.next()(); });

m.push(t[0],t[1]);
