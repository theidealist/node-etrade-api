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

t.push(function() { this.et.getOptionChains(previewOptionChainParams,this.next(),this.getErrorCallbackFor("OptionChain")); });
if (displayResults) t.push(function(optionChains) { console.log("Option Chains: " + JSON.stringify(optionChains)); this.next()(optionChains); });
t.push(function(optionChains) { this.shared.options = options = optionChains.optionDetails; this.next()(); });


// All done
