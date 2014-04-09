
// Other nodejs modules
var readline = require('readline');

// Our principal nodejs module
var etrade = require('./index');

// The keys to the castle
var options = require('./test-keys.js'); // Uncommited file.  It has valid E*TRADE keys that are not shareable
options.useSandbox = true;               // Please don't run this against the live servers

// A basic test harness for running tests with a little bit of shared state
var TestHarness = function()
{
    this.et = new etrade(options);
    this.rl = rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    this.tests = [];
    this.shared = {}; // For shared context (account list, etc.)
};

TestHarness.prototype.getErrorCallbackFor =  function(errorLabel)
{
    if (arguments.length < 1) errorLabel = "Unknown";
    
    return function(error)
    {
        console.error(errorLabel + ": " + error);
        process.exit(-1);
    };
};

TestHarness.prototype.next = function()
{
    return this.tests.shift().bind(this);
};

// Instantiate our test harness type
var testHarness = new TestHarness();

var testModules = [ require('./tests/authorization.js'),
                    require('./tests/accounts.js'),
                    require('./tests/order.js') ];

for (var index = 0; index < testModules.length; ++index)
    testModules[index].registerTests(testHarness);

// Close up shop
testHarness.tests.push(function() { 
    this.et.revokeAccessToken(this.next(),this.getErrorCallbackFor("RevokeAccessToken")); });
testHarness.tests.push(function() { 
    console.log("Tests Completed"); process.exit(0); });

// Kick it!
testHarness.next()();
