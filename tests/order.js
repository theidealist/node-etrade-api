// Tests for the order module

var runTests = true;
var displayResults = true;

var t = [];         // An array of test functions
var m = [];         // An array of mandatory test functions (usually later tests depend on these)
var accounts = [];  // A list of accounts
var orders = [];    // A list of orders for an account

exports.registerTests = function(th)
{
    th.tests = th.tests.concat(runTests ? t : m);
};

previewEquityOrderParams = { 
  accountId : "",
  symbol : "GOOG",
  orderAction : "BUY",
  clientOrderId : "AnOrderId",
  priceType : "MARKET",
  quantity : 20,
  marketSession : "REGULAR",
  orderTerm : "GOOD_FOR_DAY"
};

equityOrderParams = { 
  accountId : "",
  symbol : "GOOG",
  orderAction : "BUY",
  clientOrderId : "AnOrderId",
  priceType : "MARKET",
  quantity : 20,
  marketSession : "REGULAR",
  orderTerm : "GOOD_FOR_DAY"
};

t.push(function() { accounts = this.shared.accounts; this.next()(); });
t.push(function() { this.et.listOrders(accounts[0].accountId,this.next(),this.getErrorCallbackFor("ListOrders")); });
if (displayResults) t.push(function(orderList) { console.log("OrderList: " + JSON.stringify(orderList)); this.next()(orderList); });
t.push(function(orderList) { this.shared.orders = orders = orderList.GetOrderListResponse.orderDetails; this.next()(); });
t.push(function() { previewEquityOrderParams.accountId = equityOrderParams.accountId = accounts[0].accoundId; this.next()(); });
t.push(function() { this.et.previewEquityOrder(previewEquityOrderParams,this.next(),this.getErrorCallbackFor("PreviewEquityOrder")); });
if (displayResults) t.push(function(orderPreview) { console.log("OrderPreview: " + JSON.stringify(orderPreview)); this.next()(orderPreview); });
t.push(function(orderPreview) { equityOrderParams.previewId = orderPreview.previewId; this.next()(); });
t.push(function() { this.et.placeEquityOrder(equityOrderParams,this.next(),this.getErrorCallbackFor("PlaceEquityOrder")); });
if (displayResults) t.push(function(order) { console.log("Order: " + JSON.stringify(order)); this.next()(order); });

t.push(function() { this.next()(); });

m.push(t[0],t[1],t[3]);