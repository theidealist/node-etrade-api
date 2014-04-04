// Tests for the authorization module

var runTests = true;
var displayResults = false;

var t = [];         // An array of test functions
var m = [];         // An array of mandatory test functions (usually later tests depend on these)

exports.registerTests = function(th)
{
    th.tests = th.tests.concat(runTests ? t : m);
};

t.push(function() { 
    this.et.getRequestToken(this.next(),this.getErrorCallbackFor("GetRequestToken")); });
t.push(function(url) { 
    console.log("Authorize at: " + url); this.next()(); });
t.push(function() { rl.question("Verification Code? ",this.next()); });
t.push(function(verifier) { 
    this.et.getAccessToken(verifier,this.next(),this.getErrorCallbackFor("GetAccessToken")); });
if (displayResults) t.push(function() { console.log("Got an access token"); this.next()(); });
t.push(function() { this.et.renewAccessToken(this.next(),this.getErrorCallbackFor("RenewAccessToken")); });
if (displayResults) t.push(function() { console.log("Renewed access token"); this.next()(); });

m.push(t[0],t[1],t[2],t[3]);

