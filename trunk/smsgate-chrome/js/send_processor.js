function NotLoggedInException(){
    Error.apply(this, arguments);
}
NotLoggedInException.prototype = new Error();
NotLoggedInException.prototype.constructor = NotLoggedInException;
NotLoggedInException.prototype.name = 'NotLoggedInException';

function ArgumentException(){
    Error.apply(this, arguments);
}
ArgumentException.prototype = new Error();
ArgumentException.prototype.constructor = ArgumentException;
ArgumentException.prototype.name = 'ArgumentException';

function SendProcessor(params){
    /**
     * Odbiorca wiadomości - numer telefonu
     * @var Number
     */
    this.recipient = params.recipient || null;
    /**
     * Treść wysyłanej wiadomości
     */
    this.body = params.body || null;
    /**
     * Wysyłanie wiadomości jako MMS
     * @ignore
     */
    this.mms = params.mms || false;
}
SendProcessor.prototype.setRecipient = function(recipient){
    if( typeof recipient != 'number' ){
        throw new Error("Recipient can only be a numeric value");
    }
    this.recipient = recipient;
}
SendProcessor.prototype.getRecipient = function(){
    return this.recipient;
}
SendProcessor.prototype.setBody = function(body){
    this.body = body;
}
SendProcessor.prototype.getBody = function(){
    return this.body;
}
SendProcessor.prototype.setMms = function(mms){
    if( typeof mms != 'boolean' ){
        throw new Error("MMS flag can only be a boolean value");
    }
    this.mms = mms;
}
SendProcessor.prototype.getMms = function(){
    return this.mms;
}
/**
 * @exception ArgumentException if body or recipient is null
 * @exception NotLoggedInException if user is not logged in to application
 */
SendProcessor.prototype.sendSms = function(callbacks){
    var errorMsg = "";
    if( !this.recipient ){
        errorMsg += "Brak pola odbiorca! ";
    }
    if( !this.body ){
        errorMsg += "Brak pola tre\u015bć wiadomo\u015ci! ";
    }
    if( errorMsg != "" ){
        throw new ArgumentException( errorMsg );
    }

    var bg = chrome.extension.getBackgroundPage();
    if( !bg.eraApp.loggedIn ){
        throw new NotLoggedInException( );
    }

    var addr = VARS.sendUrl;
    var browserID = localStorage['browserID'];
    var eraGateType = localStorage['eraGateType'];

    var data = "";
    data += "body="+encodeURIComponent(this.body);
    data += "&recipient="+this.recipient;
    data += "&history="+localStorage.historyEnabled;
    data += "&bid=" + browserID;
    data += "&gateType="+eraGateType;
    var context = this;
    
    var xhr = new XMLHttpRequest();
    xhr.open("POST", addr, true);
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    xhr.setRequestHeader('X-Same-Domain', 'true');  // XSRF protector
    xhr.onreadystatechange = function() {
        if (this.readyState == 4) {
            if (xhr.status == 200) {
                var parsed = null;
                try{
                    parsed = JSON.parse(xhr.responseText);
                } catch(e){
                    console.error( "Illegal response body: ", xhr.responseText, xhr)
                }
                callbacks.success(parsed);
                if( localStorage.historyEnabled ){
                    context.saveHistory(parsed);
                }
            } else {
                callbacks.error(xhr);
            }
        }
    }
    xhr.send(data);
}
SendProcessor.prototype.saveHistory = function(data){
    data.cost = data.cost || 0;
    data.body = this.body;
    data.recipient = this.recipient;
    History.saveHistory(data);
}