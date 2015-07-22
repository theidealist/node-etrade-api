// Tests for the order module

var runTests = true;
var displayResults = true;

var t = [];         // An array of test functions
var m = [];         // An array of mandatory test functions (usually later tests depend on these)
var options = [];    // A list of orders for an account

exports.registerTests = function(th)
{
    th.tests = th.tests.concat(runTests ? t : m);
};

previewOptionChainParams = { 
  chainType : "CALL",
  expirationMonth : 7,
  expirationYear : 2015,
  underlier : "PCLN",
  skipAdjusted : true 
};

previewExpiryDates = { 
  underlier : "GOOG"
};

lookupProductParams = {
  company : "VSAT",
  type : "EQ"
}; 

getQuoteEquityParams = {
  symbol : "MSFT",
  detailFlag : "OPTIONS"
};

getQuoteOptionParams = {
  symbol :  "AAPL:2015:8:21:CALL:130",
  detailFlag : "OPTIONS"
};

// Test getOptionChains function
t.push(function() { this.et.getOptionChains(previewOptionChainParams,this.next(),this.getErrorCallbackFor("OptionChain")); });
if (displayResults) t.push(function(optionChains) { console.log("Option Chains: " + JSON.stringify(optionChains,null,2)); this.next()(optionChains); });
t.push(function(optionChains) { this.shared.options = options = optionChains.optionDetails; this.next()(); });

// Test getOptionExpireDates function
t.push(function() { this.et.getOptionExpireDates(previewExpiryDates["underlier"],this.next(),this.getErrorCallbackFor("OptionExpiry")); });
if (displayResults) t.push(function(optionExpiry) { console.log("Option Expiry Dates: " + JSON.stringify(optionExpiry,null,2)); this.next()(optionExpiry); });
t.push(function(optionExpiry) { this.shared.options = options = optionExpiry.optionDetails; this.next()(); });

// Test LookupProduct function
t.push(function() { this.et.lookupProduct(lookupProductParams,this.next(),this.getErrorCallbackFor("LookupProduct")); });
if (displayResults) t.push(function(lookupProd) { console.log("Product Lookup: " + JSON.stringify(lookupProd,null,2)); this.next()(lookupProd); });
t.push(function(lookupProd) { this.shared.options = options = lookupProd.optionDetails; this.next()(); });

// Test getQuote function for single stock
t.push(function() { this.et.getQuote(getQuoteEquityParams,this.next(),this.getErrorCallbackFor("GetQuote")); });
if (displayResults) t.push(function(quote) { console.log("Get Quote for Stock: " + JSON.stringify(quote,null,2)); this.next()(quote); });
t.push(function(quote) { this.shared.options = options = quote.optionDetails; this.next()(); });

// Test getQuote function for option 
t.push(function() { this.et.getQuote(getQuoteOptionParams,this.next(),this.getErrorCallbackFor("GetQuote")); });
if (displayResults) t.push(function(quote) { console.log("Get Quote for Option: " + JSON.stringify(quote,null,2)); this.next()(quote); });
t.push(function(quote) { this.shared.options = options = quote.optionDetails; this.next()(); });



// All done
