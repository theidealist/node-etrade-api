
exports.getOptionChains = function(params,successCallback,errorCallback)
{
    //
    // From the etrade dev portal at 
    // https://us.etrade.com/ctnt/dev-portal/getDetail?contentUri=V0_Documentation-MarketAPI-GetOptionChains
    //
	//	chainType	    enum	required	The type of option chain. Possible values are: CALL, PUT, or CALLPUT (i.e., both calls and puts).
	//	expirationMonth	integer	required	The month the option will expire
	//	expirationYear	integer	required	The year the option will expire
	//	underlier	    string	required	The market symbol for the underlying security
	//	skipAdjusted	boolean	optional	Specifies whether to show (TRUE) or not show (FALSE) adjusted options, i.e., options that have undergone a change resulting in a modification of the option contract. Default value is TRUE.
    
	if (!this.getOptionChainsDescriptors)
    {
        this.getOptionChainsDescriptors = this._buildParamsDescriptor([
           "chainType", true, this._validateAsOneOf._validateAsOneOf(["CALL","PUT","CALLPUT"]),
           "expirationMonth",true,this._validateAsInt.bind(this),
           "expirationYear",true,this._validateAsInt.bind(this),
           "underlier",true,this._validateAsString.bind(this),
           "skipAdjusted",false,this._validateAsBool.bind(this)
        ]);
    }
    
    var validationResult = this._validateParams(this.getOptionChainsDescriptors,params);
    if (validationResult.length)
        return errorCallback(validationResult); // Validation failed

    var actionDescriptor = {
        method : "GET",
        module : "market",
        action : "optionchains",
        useJSON: true,
    };
    
    this._run(actionDescriptor,params,successCallback,errorCallback);
};

exports.getOptionExpireDates = function(underlier,successCallback,errorCallback)
{
    //
    // From the etrade dev portal at 
    // https://us.etrade.com/ctnt/dev-portal/getDetail?contentUri=V0_Documentation-MarketAPI-GetOptionExpireDates
    //
	// underlier	string	required	The symbol for the underlying instrument for this option
	
	var validationResult = this._validateAsString(underlier);
	if (validationResult.length)
		return errorCallback(validationResult); // Validation failed
	
	var actionDescriptor = {
		method : "GET",
		module : "market",
		action : "optionexpiredate",
		useJSON: true,
	};
	
	this._run(actionDescriptor,{underlier:underlier},successCallback,errorCallback);
};

exports.lookupProduct = function(params,successCallback,errorCallback)
{
    //
    // From the etrade dev portal at 
    // https://us.etrade.com/ctnt/dev-portal/getDetail?contentUri=V0_Documentation-MarketAPI-LookUpProduct
    //
	//
	// company	string	required	Full or partial name of the company. Note that the system extensively abbreviates common words such as "company", "industries", and "systems", and generally skips punctuation (periods, commas, apostrophes, etc.) .
	// type	    enum	required	The type of security. Possible values are: EQ (equity) or MF (mutual fund).
	
	if (!this.lookupProductDescriptor)
    {
		this.lookupProductDescriptor = this._buildParamsDescriptor([
            "company",true,this._validateAsString.bind(this),
            "type", true, this._validateAsOneOf._validateAsOneOf(["EQ","MF"])
        ]);
    }
    
    var validationResult = this._validateParams(this.lookupProductDescriptor,params);
    if (validationResult.length)
        return errorCallback(validationResult); // Validation failed

    var actionDescriptor = {
        method : "GET",
        module : "market",
        action : "productlookup",
        useJSON: true,
    };
    
    this._run(actionDescriptor,params,successCallback,errorCallback);
};

exports.getQuote = function(params,successCallback,errorCallback)
{
    //
    // From the etrade dev portal at 
    // https://us.etrade.com/ctnt/dev-portal/getDetail?contentUri=V0_Documentation-MarketAPI-GetQuotes
    //
	//
	// symbol     path required One or more (comma-separated) symbols for equities or options, up to a maximum of 25. Symbols for equities are simple, e.g., GOOG. Symbols for options are more complex, consisting of six elements separated by colons, in this format: underlier:year:month:day:optionType:strikePrice.
	// detailFlag enum optional Optional parameter specifying which details to return in the response. The field set for each possible value is listed in separate tables below. The possible values are: 
	//                                 • FUNDAMENTAL - Instrument fundamentals and latest price
	//                                 • INTRADAY - Performance for the current or most recent trading day
	//                                 • OPTIONS - Information on a given option offering 
	//                                 • WEEK52 - 52-week high and low (highest high and lowest low)
	//                                 • ALL (default) - All of the above information and more
	
	if (!this.getQuoteDescriptor)
    {
		var symbolValidator = function(val)
		{
			var valid = true;
			if (typeof(val) == "string")
			{
				if (val.indexOf(",") != -1)
				{
					val = val.split(",").filter(Boolean);
				}
				else
				{
					valid = val.length > 0;
					val = [ val ];
				}
			}
			else if (val instanceof Array)
			{
				val = val.filter(Boolean);
			}
			else
			{
				valid = false;
			}
			
			if (valid)
			{
				// At this point val should be an array of non-zero-length strings
				valid = val.length > 0 && val.length < 26; // validity is at least one and less than 25 symbols
				val = val.join(","); // re-stringify things
			}
			
			return { valid:valid, value:val };
		};
		
		this.getQuoteDescriptor = this._buildParamsDescriptor([
            "symbol",true,symbolValidator,
            "detailFlag", false, this._validateAsOneOf._validateAsOneOf(["FUNDAMENTAL","INTRADAY","OPTIONS","WEEK52","ALL"])
        ]);
    }
    
    var validationResult = this._validateParams(this.getQuoteDescriptor,params);
    if (validationResult.length)
        return errorCallback(validationResult); // Validation failed

    var actionDescriptor = {
        method : "GET",
        module : "market",
        action : "quote/" + params.symbol,
        useJSON: true,
    };
    
    delete params.symbol;
    
    this._run(actionDescriptor,params,successCallback,errorCallback);
};

