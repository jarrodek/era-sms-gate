/**
 * Synchronizacja kontaktów gmail.
 */
function Gsync(){
    this.checkConfig();
    this.db = DatabaseHelper.getConnection();
    this.synchContacts = null;
}
/**
 * Włączenie synchronizacji z gmail w ustawieniach aplikacji.
 */
Gsync.prototype.checkConfig = function(){
    if( localStorage['synchGmail'] == 'false' || !localStorage['synchGmail'] ){
        localStorage['synchGmail'] = true;
    }
}
Gsync.prototype.init = function(){
    if( sessionStorage['gsyncProgress'] > 0 ){
        return;
    }
    sessionStorage['gsyncProgress'] = 1;
    var oauth = chrome.extension.getBackgroundPage().oauth;
    var url = "http://www.google.com/m8/feeds/contacts/default/full";
    var context = this;

    var callback = function(){
        oauth.sendSignedRequest(url, function(text, xhr){context.parseGoogleContacts.call(context,text, xhr)}, {
            'parameters' : {
                'alt' : 'json',
                'max-results' : 1000
            }
        });
    }

    if( oauth.hasToken() ){
        callback();
    } else {
        oauth.authorize(callback);
    }    
}
Gsync.prototype.parseGoogleContacts = function(text, xhr){
    var context = this;
    var worker = new Worker('js/gmail_worker.js');
    worker.onerror = function(event){
        throw new Error(event.message + " (" + event.filename + ":" + event.lineno + ")");
    };
    worker.onmessage = function(event){
        
        if( typeof event.data == 'object' && event.data.length > 0 ){
            context.synchContacts = event.data;
            context.storeContacts();
        }
        localStorage.synchGmailTime = new Date().getTime();
        sessionStorage['gsyncProgress'] = 0;
    };
    worker.postMessage(text);
}
Gsync.prototype.storeContacts = function(){
    if(this.synchContacts == null || this.synchContacts.length == 0 ){
        return;
    }
    this.toInsertCount = 0;
    var count = this.synchContacts.length;
    for( var i=0, item; i<count; i++ ){
        item = this.synchContacts[i];
        this.sync(item);
    }
}
Gsync.prototype.sync = function(contact){
    
    if( !(contact.name && contact.phone) ) return;
    var phone_count = contact.phone.length;
    var _tmp_phone = [];
    for( var i = 0, phone; i < phone_count; i++ ){
        phone = contact.phone[i];
        if(NumberFormatter.checkFormat(phone)){
            phone = NumberFormatter.formatNumber(phone);
            if(phone.toString().length==11){
                _tmp_phone[_tmp_phone.length] = phone;
                this.toInsertCount++;
            }
        }
    }
    this.insertContact(contact.name, _tmp_phone, contact.id, contact.photo);
}
Gsync.prototype.updateTabs = function(){


    var e = chrome.extension.getBackgroundPage().AppEvents;
    e.fire('contacts.update', null);

    
}
Gsync.prototype.insertContact = function(name, number, id, photo){
    var context = this;
    var insertParams = {
        name:   name,
        number: number,
        gid:    id,
        photo:  photo,
        callback: function(){
            context.toInsertCount--;
            if(context.toInsertCount == 0){
                context.updateTabs();
            }
        },
        error: function(error){ 
            console.error(error);
            context.toInsertCount--;
            if(context.toInsertCount == 0){
                context.updateTabs();
            }
        }
    }
    DatabaseHelper.insertContact(insertParams);
}
var gsync = new Gsync();
