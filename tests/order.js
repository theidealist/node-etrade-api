// Tests for the order module

var runTests = true;
var displayResults = true;

var t = [];         // An array of test functions
var m = [];         // An array of mandatory test functions (usually later tests depend on these)
var accounts = [];  // A list of accounts
var account0Id;     // The first account id
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

t.push(function() { accounts = this.shared.accounts; account0Id = accounts[0].accountId; this.next()(); });
t.push(function() { this.et.listOrders(account0Id,this.next(),this.getErrorCallbackFor("ListOrders")); });
if (displayResults) t.push(function(orderList) { console.log("OrderList: " + JSON.stringify(orderList)); this.next()(orderList); });
t.push(function(orderList) { this.shared.orders = orders = orderList.GetOrderListResponse.orderDetails; this.next()(); });
t.push(function() { previewEquityOrderParams.accountId = equityOrderParams.accountId = account0Id; this.next()(); });
t.push(function() { this.et.previewEquityOrder(previewEquityOrderParams,this.next(),this.getErrorCallbackFor("PreviewEquityOrder")); });
if (displayResults) t.push(function(orderPreview) { console.log("OrderPreview: " + JSON.stringify(orderPreview)); this.next()(orderPreview); });
t.push(function(orderPreview) { equityOrderParams.previewId = orderPreview.previewId; this.next()(); });
t.push(function() { this.et.placeEquityOrder(equityOrderParams,this.next(),this.getErrorCallbackFor("PlaceEquityOrder")); });
if (displayResults) t.push(function(order) { console.log("Order: " + JSON.stringify(order)); this.next()(order); });
t.push(function(order) { this.next()(); });

// Option Orders
previewOptionOrderParams = {
  "accountId": "",
  "quantity": "1",
  "symbolInfo": {
      "symbol": "IBM",
      "callOrPut": "CALL",
      "strikePrice": "115",
      "expirationYear": "2014",
      "expirationMonth": "5",
      "expirationDay": "17"
  },
  "orderAction": "BUY_OPEN",
  "priceType": "MARKET",
  "orderTerm": "GOOD_FOR_DAY",
  "clientOrderId" : "DifferentOrderId"
};

placeOptionOrderParams = {
  "accountId": "",
  "clientOrderId": "259",
  "limitPrice": "10",
  "quantity": "1",
  "symbolInfo": {
      "symbol": "IBM",
      "callOrPut": "CALL",
      "strikePrice": "115",
      "expirationYear": "2015",
      "expirationMonth": "5",
      "expirationDay": "17"
  },
  "orderAction": "BUY_OPEN",
  "priceType": "LIMIT",
  "orderTerm": "GOOD_FOR_DAY"
};

t.push(function() { previewOptionOrderParams.accountId = account0Id; this.next()(); });
t.push(function() { placeOptionOrderParams.accountId = account0Id; this.next()(); });
t.push(function() { this.et.previewOptionOrder(previewOptionOrderParams,this.next(),this.getErrorCallbackFor("PreviewOptionOrder")); });
if (displayResults) t.push(function(res) { console.log("PreviewOptionOrderResponse: " + JSON.stringify(res)); this.next()(res); });
t.push(function(res) { previewOptionOrderParams.previewId = res.PreviewOptionOrderResponse.OptionOrderResponse.previewId; this.next()(); });
t.push(function() { this.et.placeOptionOrder(previewOptionOrderParams,this.next(),this.getErrorCallbackFor("PlaceOptionOrder-1")); });
if (displayResults) t.push(function(res) { console.log("PlaceOptionOrder-1Response: " + JSON.stringify(res)); this.next()(res); });
t.push(function(res) { this.next()(); });

// Note sure why these cause E*TRADE server to return with an unhelpful HTTP status 500 "The server encountered an internal 
// error () that prevented it from fulfilling this request." message.  Ugh.
//t.push(function() { this.et.placeOptionOrder(placeOptionOrderParams,this.next(),this.getErrorCallbackFor("PlaceOptionOrder-2")); });
//if (displayResults) t.push(function(res) { console.log("PlaceOptionOrder-2Response: " + JSON.stringify(res)); this.next()(res); });
//t.push(function(res) { this.next()(); });

t.push(function() { this.et.cancelOrder({ accountId : account0Id, orderNum:262 },this.next(),this.getErrorCallbackFor("CancelOrder")); });
if (displayResults) t.push(function(res) { console.log("CancelOrderResponse: " + JSON.stringify(res)); this.next()(res); });
t.push(function(res) { this.next()(); });

// All done