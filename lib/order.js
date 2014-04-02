
exports.listOrders = function(accountId,successCallback,errorCallback)
{
    //
    // From the etrade dev portal at 
    // https://us.etrade.com/ctnt/dev-portal/getDetail?contentUri=V0_Documentation-OrderAPI-ListOrders
    //
    
    var validationResult = this._validateAsString(accountId);
    if (!validationResult.valid)
        return errorCallback("The accountId parameter is invalid");
    
    var actionDescriptor = {
            method : "GET",
            module : "order",
            action : "orderlist/" + validationResult.value,
            useJSON: true,
    };
    
    this._run(actionDescriptor,{},successCallback,errorCallback);
};
