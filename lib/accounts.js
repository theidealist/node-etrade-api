
exports.listAccounts = function(successCallback,errorCallback)
{
    //
    // From the etrade dev portal at 
    // https://us.etrade.com/ctnt/dev-portal/getDetail?contentUri=V0_Documentation-AccountsAPI-ListAccounts
    //
    var actionDescriptor = {
            method : "GET",
            module : "accounts",
            action : "accountlist",
            useJSON: true,
    };
    
    this._run(actionDescriptor,{},successCallback,errorCallback);
};

exports.getAccountBalance = function(accountId,successCallback,errorCallback)
{
    //
    // From the etrade dev portal at 
    // https://us.etrade.com/ctnt/dev-portal/getDetail?contentUri=V0_Documentation-AccountsAPI-GetAccountBalance
    //
    // accountId   path    required    Numeric account ID
    var actionDescriptor = {
            method : "GET",
            module : "accounts",
            action : "accountbalance/" + String(accountId),
            useJSON: true,
    };
    
    this._run(actionDescriptor,{},successCallback,errorCallback);
};

exports.getAccountPositions = function(params,successCallback,errorCallback)
{
    //
    // From the etrade dev portal at 
    // https://us.etrade.com/ctnt/dev-portal/getDetail?contentUri=V0_Documentation-AccountsAPI-GetAccountPositions
    //
    // accountId   path    required    Numeric account ID
    // count   integer     optional    The number of positions to return in the response. If not specified, defaults to 25. Used for paging as described in the Notes below.
    // marker  string  optional    Specifies the desired starting point of the set of items to return. Used for paging as described in the Notes below.
    // typeCode    string  optional    The type of security. Possible values are: EQ (equity), OPTN (option), INDX (index), MF (mutual fund), FI (fixed income). If set to OPTN, must specify callPut, strikePrice, expYear, expMonth, and expDay.
    // symbol  string  conditional     The market symbol. Required if typeCode is OPTN.
    // callPut     enum    conditional     Specifies which type of option(s) to return. Possible values are: CALL or PUT. Required if typeCode is OPTN.
    // strikePrice     double  conditional     Specifies the strikePrice of the desired option. Required if typeCode is OPTN.
    // expYear     string  conditional     The year the option will expire, as specified in the option contract. Required if typeCode is OPTN.
    // expMonth    integer     conditional     The year the option will expire, as specified in the option contract. Required if typeCode is OPTN.
    // expDay  integer     conditional     The year the option will expire, as specified in the option contract. Required if typeCode is OPTN.

    var isTypeCodeOption = function() { params.hasOwnProperty("typeCode") && params.typeCode == "OPT"; };
    
    if (!this.accountPositionDescriptors)
    {
        this.accountPositionDescriptors = [
            {
                name : "accountId",
                required : true,
                validator :  this._validateAsString.bind(this),
            },
            {
                name : "count",
                required : false,
                validator : this._validateAsInt(val).bind(this),
            },
            {
                name : "marker",
                required : false,
                validator : this._validateAsString.bind(this),
            },
            {
                name : "typeCode", 
                required : false,
                validator : function(val) { return this._validateAsOneOf(val,["EQ","OPTN","INDX","MF","FI"]); }.bind(this),
            },
            {
                name : "symbol",
                required : function() { return isTypeCodeOption(); },
                validator : this._validateAsString.bind(this),
            },
            {
                name : "callPut",
                required : function() { return isTypeCodeOption(); },
                validator : function(val) { return this._validateAsOneOf(val,["CALL","PUT"]); }
            },
            {
                name : "strikePrice",
                required : function() { return isTypeCodeOption(); },
                validator : this._validateAsFloat.bind(this),
            },
            {
                name : "expYear",
                required : function() { return isTypeCodeOption(); },
                validator : this._validateAsString.bind(this),
            },
            {
                name : "expMonth",
                required : function() { return isTypeCodeOption(); },
                validator : this._validateAsInt.bind(this),
            },
            {
                name : "expDay",
                required : function() { return isTypeCodeOption(); },
                validator : this._validateAsInt.bind(this)
            }
        ];
    }
    
    var validationResult = this._validateParams(this.accountPositionDescriptors,params);
    if (validationResult.length)
        return errorCallback(validationResult); // Validation failed

    var actionDescriptor = {
            method : "GET",
            module : "accounts",
            action : "accountpositions/" + params.accountId,
            useJSON: true,
    };
    
    delete params.accountId;
    
    this._run(actionDescriptor,params,successCallback,errorCallback);
};

exports.getTransactionHistory = function(params,successCallback,errorCallback)
{
    //
    // From the etrade dev portal at 
    // https://us.etrade.com/ctnt/dev-portal/getDetail?contentUri=V0_Documentation-AccountsAPI-GetTransactionHistory
    //
    // accountId   path    required    Numeric account ID. This is the only required parameter.
    // group   path    optional    Major groupings of the transaction types defined in the Transaction types table below. Possible values are: DEPOSITS, WITHDRAWALS, TRADES.
    // assetType   path        Only allowed if group is TRADES. Possible values are: EQ (equities), OPTN (options), MMF (money market funds), MF (mutual funds), BOND (bonds). To retrieve all types, use ALL or omit this parameter.
    // transactionType     path        Transaction type(s) to include, e.g., check, deposit, fee, dividend, etc. A list of types is provided in the Transaction types table below. If a group is specified, this can be a comma-separated list of valid types for the group. Otherwise, only one type is accepted.
    // tickerSymbol    path        Only allowed if group is TRADES. A single market symbol, e.g., GOOG.
    // startDate   string      The earliest date to include in the date range, formatted as MMDDYYYY. History is available for two years.
    // endDate     string      The latest date to include in the date range, formatted as MMDDYYYY.
    // count   integer         Number of transactions to return in the response. If not specified, defaults to 50. Used for paging as described in the Notes below.
    // marker  integer         Specifies the desired starting point of the set of items to return. Used for paging as described in the Notes below.

    var isGroupTrades = function() { params.hasOwnKey("group") && params.group; };
    
    if (!this.transactionHistoryDescriptors)
    {
        this.transactionHistoryDescriptors = this._buildParamsDescriptor([
           "accountId", true, this._validateAsString.bind(this),
           "group", false, function(val) { return this._validateAsOneOf(val,["DEPOSITS","WITHDRAWALS","TRADES"]); }.bind(this),
           "assetType", isGroupTrades, function(val) { var res = this._validateAsOneOf(val,["EQ","OPTN","MMF","MF","BOND"]); 
                                                        res.valid = res.valid && isGroupTrades(); return res; }.bind(this),
           "transactionType", false, this._validateAsString.bind(this), // A better validator is probably not in scope right now
           "tickerSymbol", isGroupTrades, function(val) { return { valid:isGroupTrades(), value:String(val), }; }.bind(this),
           "startDate",  false, this._validateAsMMDDYYYYDate.bind(this),
           "endDate", false, this._validateAsMMDDYYYYDate.bind(this),
           "count", false, this._validateAsInteger.bind(this),
           "marker", false, this._validateAsInteger.bind(this),
        ]);
    }
    
    var validationResult = this._validateParams(this.transactionHistoryDescriptors,params);
    if (validationResult.length)
        return errorCallback(validationResult); // Validation failed

    var actionDescriptor = {
            method : "GET",
            module : "accounts",
            action : params.accountId + "/transactions",
            useJSON: true,
    };
    
    delete params.accountId;
    
    
    // https://etws.etrade.com/accounts/rest/{accountId}/transactions/{Group}/{AssetType}/{TransactionType}/{TickerSymbol}{.json}
    if (params.hasOwnKey("group"))
    {
        actionDescriptor.action += "/" + params.group;
        delete params.group;
        
        if (params.hasOwnKey("assetType"))
        {
            actionDescriptor.action += "/" + params.assetType;
            delete params.assetType;
        }
        
        if (params.hasOwnKey("transactionType"))
        {
            actionDescriptor.action += "/" + params.transactionType;
            delete params.transactionType;
        }
        
        if (params.hasOwnKey("tickerSymbol"))
        {
            actionDescriptor.action += "/" + params.tickerSymbol;
            delete params.tickerSymbol;
        }
    }
    
    this._run(actionDescriptor,params,successCallback,errorCallback);
};

exports.getTransactionDetails = function(params,successCallback,errorCallback)
{
    //
    // From the etrade dev portal at 
    // https://us.etrade.com/ctnt/dev-portal/getDetail?contentUri=V0_Documentation-AccountsAPI-GetTransactionDetails
    //
    // accountId    path    required    Numeric account ID
    // transactionId   path    required    Numeric transaction ID, usually acquired by using the Get Transaction History API.
    if (!this.transactionDetailsDescriptors)
    {
        this.transactionDetailsDescriptors = this._buildParamsDescriptor([
           "accountId", true, this._validateAsString.bind(this),
           "transactionId", true, this._validateAsString.bind(this),
        ]);
    }
    
    var validationResult = this._validateParams(this.transactionDetailsDescriptors,params);
    if (validationResult.length)
        return errorCallback(validationResult); // Validation failed

    var actionDescriptor = {
            method : "GET",
            module : "accounts",
            action : params.accountId + "/transactions/" + params.transactionId,
            useJSON: true,
    };
    
    this._run(actionDescriptor,{},successCallback,errorCallback);
};

exports.listAlerts = function(successCallback,errorCallback)
{
    //
    // From the etrade dev portal at 
    // https://us.etrade.com/ctnt/dev-portal/getDetail?contentUri=V0_Documentation-AccountsAPI-ListAlerts
    //
    var actionDescriptor = {
            method : "GET",
            module : "accounts",
            action : "alerts",
            useJSON: true,
    };
    
    this._run(actionDescriptor,{},successCallback,errorCallback);
};

exports.getAlert = function(alertId,successCallback,errorCallback)
{
    //
    // From the etrade dev portal at 
    // https://us.etrade.com/ctnt/dev-portal/getDetail?contentUri=V0_Documentation-AccountsAPI-ReadAlert
    //
    // alertId  path    required    Numeric alert ID
    var actionDescriptor = {
            method : "GET",
            module : "accounts",
            action : "alerts/" + String(alertId),
            useJSON: true,
    };
    
    this._run(actionDescriptor,{},successCallback,errorCallback);
};

exports.deleteAlert = function(alertId,successCallback,errorCallback)
{
    //
    // From the etrade dev portal at 
    // https://us.etrade.com/ctnt/dev-portal/getDetail?contentUri=V0_Documentation-AccountsAPI-DeleteAlerts
    //
    // alertId  path    required    Numeric alert ID
    var actionDescriptor = {
            method : "DELETE",
            module : "accounts",
            action : "alerts/" + String(alertId),
            useJSON: true,
    };
    
    this._run(actionDescriptor,{},successCallback,errorCallback);
};
