function loadContacts(){
    var title = chrome.i18n.getMessage( 'contacts_page_title' );
    document.title = title;
    MenuBuilder.build();

    var oauth = chrome.extension.getBackgroundPage().oauth;
    var syncAnchor = document.getElementById('google-sync');
    syncAnchor.addEventListener('click', function(e){
        e.preventDefault();
        chrome.tabs.create({url:chrome.extension.getURL('enable_gmail_contacts.html')});
    });
    if(oauth && oauth.hasToken()){
        var logountGmail = document.createElement( 'a' );
        logountGmail.innerHTML = 'Wyloguj z Gmail';
        logountGmail.id = 'gmail-logout';
        logountGmail.href = '#';
        syncAnchor.parentNode.appendChild(logountGmail);
        logountGmail.addEventListener('click', function(e){
            e.preventDefault();
            var bg = chrome.extension.getBackgroundPage();
            bg.oauth.clearTokens();
            if( bg.eraApp.loggedIn )
                bg.eraApp.setPageIconAction('app-connected');
            else
                bg.eraApp.setPageIconAction('not-connected');
            this.parentNode.removeChild(this);
        });
    }

    contactsObject.init();
    var insertAction = getParam( "insert" ) != null;
    if( insertAction ){
        var evt = document.createEvent("HTMLEvents");
        evt.initEvent('click', true, true ); // event type,bubbling,cancelable
        evt.data = {initNumber:getParam( "insert" )};
        document.getElementById('add-contact-lnk').dispatchEvent(evt);
    }
    chrome.extension.onConnect.addListener(function(port) {
        port.onMessage.addListener(function(msg) {
            if( msg.payload ){
                if(msg.payload == "reload-catalog"){
                    //contactsObject.init();
                    document.location.reload();
                }
            }
        });
    });
}
function getParam( name ) {
  name = name.replace(/[\[]/,"\\\[").replace(/[\]]/,"\\\]");
  var regexS = "[\\?&]"+name+"=([^&#]*)";
  var regex = new RegExp( regexS );
  var results = regex.exec( document.location.href );
  if( results == null )
    return null;
  else
    return results[1];
}
function Contacts(){
    this.loadConfig();
    
}
Contacts.prototype.loadConfig = function(){
    this.db = DatabaseHelper.getConnection();
    this.oauth = chrome.extension.getBackgroundPage().oauth;
    this.hasToken = (this.oauth && this.oauth.hasToken());
}
Contacts.prototype.init = function(){
    this.search();
    this.addContact();
    this.initContactsProcessor();
}
Contacts.prototype.initContactsProcessor = function(){
    document.querySelector("div.contacts-table").innerHTML = '';
    var query = "SELECT c.ID, c.photo, c.name, p.ID AS pid, p.number FROM contacts AS c ";
    query += "JOIN phones AS p ON c.ID = p.contact_id ";
    query += "WHERE 1 ORDER BY c.name";
    var context = this;
    var callback = function(tx, result){return context.queryHandler.call(context, tx, result);}
    this.db.transaction(function(tx) {
        tx.executeSql(query,[],callback,function(tx,err){console.error('query error',err)});
    });
}

Contacts.prototype.addContact = function(){
    var anchor = document.getElementById('add-contact-lnk');
    var context = this;
    function submitFormHandler(e){
        //UI.closeDialog();

        var form = document.querySelector('div.dialog-content form.add-contact-form');
        var inputs = document.querySelectorAll('div.dialog-content form.add-contact-form input:not(*[type="submit"]):not(button)');
        var phone = document.querySelector('div.dialog-content form.add-contact-form input[type="tel"]');
        var _inp_cnt = inputs.length;
        if( !form.checkValidity() || !NumberFormatter.checkFormat( phone.value ) ){
            for( var i=0;i<_inp_cnt;i++ ){
                if( inputs[i].checkValidity() ){
                    inputs[i].removeClass('validate-error');
                } else {
                    inputs[i].addClass('validate-error');
                }
            }
            if( !NumberFormatter.checkFormat( phone.value ) ){
                phone.addClass('validate-error');
            }
            return;
        } else {
            for( var i=0;i<_inp_cnt;i++ ){
                if( inputs[i].checkValidity() ){
                    inputs[i].removeClass('validate-error');
                }else {
                    inputs[i].addClass('validate-error');
                }
            }
        }
        var contactName = document.querySelector('div.dialog-content form.add-contact-form input[name="contact-name"]').value;
        var contactNumber = NumberFormatter.formatNumber( phone.value );
        DatabaseHelper.insertContact({
            name: contactName,
            number: contactNumber,
            callback: function(data){
                var tb = document.querySelector('table.contacts-table');
                if( tb == null ){
                    tb = document.createElement( 'table' );
                    tb.className = 'contacts-table';
                    document.querySelector('div.contacts-table').appendChild( tb );
                }
                tb.appendChild( context.createTableRow( {
                    id: data.id,
                    name: contactName,
                    photo: null,
                    phone: [{id:data.number_id,number:contactNumber}]
                } ) );
                UI.closeDialog();

                var info = document.querySelector('p.no-contact-info');
                if( info != null ){
                    info.parentNode.removeChild(info);
                }

            },
            error: function(error){
                alert("Wystąpił błąd dodania kontaktu :(")
                console.log(error)
            }
        });   
    }
    
    anchor.addEventListener('click', function(e){
        e.preventDefault();
        UI.dialog( {
            width: 400,
            height: 300,
            content: document.querySelector('div.add-contact-form'),
            title: 'Nowy kontakt',
            buttons: [
                {label:'Zapisz',action:submitFormHandler,type:'button'},
                {label:'Anuluj',action:function(e){e.preventDefault();UI.closeDialog();},type:'link'}
            ]
        } );
        if( e.data ){
            if(e.data.initNumber){
                document.querySelector('div.dialog-content form.add-contact-form input[type="tel"]').value = e.data.initNumber;
            }
            if(e.data.initName){
                document.querySelector('div.dialog-content form.add-contact-form input[name="contact-name"]').value = e.data.initName;
            }
        }
    });
}
Contacts.prototype.search = function(){

    function executeSearch(e){
        var log = document.getElementById('table-log');
        log.innerHTML = '';
        var query = this.value.toLowerCase();

        if( query == "" ){
            var _all = document.querySelectorAll('table.contacts-table > tr');
            var _c = _all.length;
            for( var i=0; i<_c; i++ ){
                if(_all[i] && _all[i].style.display == 'none'){
                    _all[i].style.display = 'table-row';
                }
            }
            return;
        }
        var rows = null;
        if( isNaN( query ) ) {
            //string, name
            rows = document.querySelectorAll('table.contacts-table > tr[search-query]');
        } else {
            rows = document.querySelectorAll('table.contacts-table span.contact-phone-wrapper[search-query]');
        }
        var cnt = rows.length;
        var hidden = 0;
        for( var i=0, row; i<cnt; i++ ){
            row = rows[i];
            var attr = row.getAttribute( 'search-query' );
            if( attr.toString().toLowerCase().indexOf(query) != -1 ){
                if( row.nodeName == 'TR' ){
                    row.style.display = 'table-row';
                } else {
                    row.getParent('tr').style.display = 'table-row';
                }

            } else {
                if( row.nodeName == 'TR' ){
                    row.style.display = 'none';
                } else {
                    row.getParent('tr').style.display = 'none';
                }
                hidden++;
            }
        }
        if( cnt == hidden ){
            log.innerHTML = '<p class="no-contacts-info">Brak kontaktów spe\u0142niających kryteria</p>';
        }
    }
    var fld = document.getElementById('search-q');
    fld.addEventListener('keyup', executeSearch);
    fld.addEventListener('search', executeSearch);
}
Contacts.prototype.queryHandler = function(tx, result){
    var worker = new Worker('js/contacts_worker.js');
    worker.onerror = function(event){
        throw new Error(event.message + " (" + event.filename + ":" + event.lineno + ")");
    }
    var context = this;
    var callback = function(event){return context.appendContacts.call(context, event);}
    worker.onmessage = callback;

    var cnt = result.rows.length;
    
    if( cnt != 0 ){
        for( var i=0, item=null; i< cnt; i++ ){
            item = result.rows.item(i);
            worker.postMessage(item);
        }
        worker.postMessage('start');
    } else {
        this.noContactsInfo();
    }
}
Contacts.prototype.appendContacts = function(event){
    
    if( typeof event.data == 'object' && event.data.length > 0 ){
        var progress = document.querySelector("div.contacts-loader > progress");
        var contacts = event.data;
        //[{name:'name',photo:'photo',phone:[{id:'ID',number:''NO},(n...)]}]
        var len = contacts.length;
        progress.max = len;
        progress.value = 0;
        var table = this.createTableWrapper();
        for( var i=0; i<len; i++ ){
            var contact = contacts[i];
            progress.value = i;
            table.appendChild( this.createTableRow( contact ) );
        }
        document.querySelector('div.contacts-table').appendChild( table );
        progress.parentNode.style.display = 'none';
    } else {
        this.noContactsInfo();
    }
}
Contacts.prototype.createTableWrapper = function(){
    var table = document.createElement('table');
    table.className = 'contacts-table';
    table.cellSpacing = 0;
    table.cellPadding = 0;
    table.border = 0;
    return table;
}
Contacts.prototype.createTableRow = function(data){
    var tr = document.createElement('tr');
    var name = document.createElement('td');
    var phones = document.createElement('td');
    var actions = document.createElement('td');
    tr.appendChild(name);
    tr.appendChild(phones);
    tr.appendChild(actions);

    tr.id = 'row-'+data.id;
    tr.setAttribute('search-query', data.name);

    name.className = 'td-name';
    phones.className = 'td-phones';
    actions.className = 'td-actions';

    var nameWrapper = document.createElement('span');
    nameWrapper.className = 'contact-name';
    nameWrapper.innerHTML = data.name;
    name.appendChild( nameWrapper );
    
    this.observeNameField(nameWrapper, data.id);
    
    if( data.photo && this.hasToken ){
        var photo = document.createElement('span');
        photo.className = 'contact-photo';
        var img = new Image();
        img.src = this.oauth.signURL(data.photo,'GET',{});
        photo.appendChild( img );
        name.appendChild( photo );
    }

    var phone_cnt = data.phone.length;
    for( var i=0; i<phone_cnt; i++ ){
        var phone = data.phone[i];
        var phoneWrapper = this.createContactPhoneItem(phone);
        phones.appendChild( phoneWrapper );
    }
    //add number action
    var add = new Image();
    add.src = 'images/add.png';
    add.className = 'add-number-action';
    add.title = chrome.i18n.getMessage( 'add_action_icon_title' );
    actions.appendChild( add );
    this.observeAddNumberAction(add, data.id);

    //delete action
    var del = new Image();
    del.src = 'images/delete.png';
    del.className = 'delete-action';
    del.title = chrome.i18n.getMessage( 'delete_action_icon_title' );
    actions.appendChild( del );
    this.observeDeleteAction(del, data.id);

    //history action
    var his = new Image();
    his.src = 'images/history24.png';
    his.className = 'history-action';
    his.title = chrome.i18n.getMessage( 'history_action_icon_title' );
    actions.appendChild( his );
    this.observeHistoryAction( his, data.id );
    
    return tr;
}
Contacts.prototype.observeHistoryAction = function(element, editId){
    element.addEventListener('click', function(){
        var URL = chrome.extension.getURL('history.html?show='+editId);
        chrome.tabs.create({url:URL});
    });
}

Contacts.prototype.createContactPhoneItem = function(phoneData){
    var phoneWrapper = document.createElement('div');
    phoneWrapper.className = 'contact-phone-wrapper';
    phoneWrapper.setAttribute('search-query', phoneData.number);

    var phoneItem = document.createElement('div');
    phoneItem.className = 'contact-phone-item';
    phoneWrapper.appendChild( phoneItem );

    var span_container = document.createElement('span')
    span_container.className='number-holder';
    span_container.innerHTML = phoneData.number;
    phoneItem.appendChild( span_container );

    //edit ctrl
    var ctrl = new Image();
    ctrl.className = 'edit-contact';
    ctrl.src = 'images/edit-text.png';
    ctrl.title = chrome.i18n.getMessage( 'edit_action_icon_title' );

    //send sms ctrl
    var send = new Image();
    send.className = 'send-sms';
    send.src = 'images/sendsms.png';
    send.title = chrome.i18n.getMessage( 'sendsms_action_icon_title' );

    phoneItem.appendChild( ctrl );
    phoneItem.appendChild( send );
    ctrl.addEventListener('click', function(e){
        var evt = document.createEvent("HTMLEvents");
        evt.initEvent('mouseover', true, true ); // event type,bubbling,cancelable
        this.getParent('div').querySelector('span.number-holder').dispatchEvent(evt);
    });

    this.observeSendSMSIcon(send, phoneData.id);
    this.observePhoneField(span_container,phoneData.id);

    return phoneWrapper;
}

Contacts.prototype.observeAddNumberAction = function(icon, contactId){
    var context = this;
    function handler(e){
        var phone = document.querySelector('div.dialog-content form.add-phone-form input[type="tel"]');
        if( !phone.checkValidity() || !NumberFormatter.checkFormat( phone.value ) ){
            phone.addClass('validate-error');
            return;
        } else {
            phone.removeClass('validate-error');
        }
        var contactNumber = NumberFormatter.formatNumber( phone.value );
        context.db.transaction(function(tx) {
            tx.executeSql("INSERT INTO phones (contact_id,number,updated) VALUES (?,?,datetime('now'))", [contactId,contactNumber], function(tx,res){
                var number_id = res.insertId;
                var dataElement = context.createContactPhoneItem({id:number_id,number:contactNumber});
                var td = document.querySelector('div.contacts-table table.contacts-table > tr[id="row-'+contactId+'"] > td.td-phones');
                td.appendChild( dataElement );
                UI.closeDialog()
            },function(error){
                alert("Wyst\u0105pił bł\u0105d dodania numeru :(")
                console.log(error)
            });
        });
    }
    icon.addEventListener('click', function(e){
        e.preventDefault();
        context.db.transaction(function(tx) {
            tx.executeSql("SELECT name FROM contacts WHERE id = ?", [contactId], function(tx,res){
                var name = res.rows.item(0).name;
                UI.dialog( {
                    width: 400,
                    height: 240,
                    content: document.querySelector('div.add-phone-form'),
                    title: 'Nowy numer dla '+name,
                    buttons: [
                        {label:'Zapisz',action:handler,type:'button'},
                        {label:'Anuluj',action:function(e){e.preventDefault();UI.closeDialog();},type:'link'}
                    ]
                } );
            }, null);
        });

        
    });
}
Contacts.prototype.observeSendSMSIcon = function(icon, phoneId){
    var context = this;
    function sendSmsCallback(icon, phoneId){
        var bg = chrome.extension.getBackgroundPage();
        if( !bg.eraApp.isConnected() ){
            UI.dialog( {
                width: 400,
                height: 160,
                content: '<p>Brak po\u0142ączenia z aplikacją. Spróbuj ponownie później</p>',
                title: 'Nie mo\u017cna wys\u0142ać SMSa :(',
                buttons: [
                    {label:'Zamknij',action:function(){
                        UI.closeDialog();
                    },type:'button'}
                ]
            } );
        } else {

            function inputBodyHandler(e){
                var str = StringFormatter.formatMessageLocale( this.value );
                document.querySelector("div.dialog-content form.send-text-form span.char_cnt").innerHTML = str.length;

                var max = Gate.maxSigns[Gate.type];
                if(max != -1){
                    if(str.length > max){
                        str = str.substr(0,max);
                    }
                    document.querySelector("div.dialog-content form.send-text-form span.char_left").innerHTML = (max-str.length);
                }
                var signs_per_one = Gate.signs[Gate.type];
                var one_cost = Gate.cost[Gate.type];
                var _x = Math.floor(str.length/signs_per_one);
                if( str.length%signs_per_one != 0 ){
                    _x++;
                }
                document.querySelector("div.dialog-content form.send-text-form span.sms_cnt").innerHTML = _x;
                document.querySelector("div.dialog-content form.send-text-form span.cost_txt").innerHTML = (_x*one_cost)+" \u017cetonów";
                this.value = str;
            }

            function handler(e,item){
                var button = document.querySelector('div.dialog-buttons button:first-child');
                button.addClass('buttonSending');
                button.setAttribute( 'disabled' , true);
                button.innerHTML = 'wysyłanie....';
                var body = document.querySelector('div.dialog-content form.send-text-form textarea').value;
                var number = item.number;
                var sp = new SendProcessor({
                    body:body,
                    recipient:number
                });
                try{
                    sp.sendSms({
                        success: function(data){
                            if( data.error && data.error.code ){
                                var eLocaleMessage = chrome.i18n.getMessage("error_"+data.error.code);
                                var eMsg = chrome.i18n.getMessage("error", [eLocaleMessage]);
                                alert(eMsg);
                                button.removeClass('buttonSending');
                                button.removeAttribute( 'disabled' , true);
                                button.innerHTML = 'Wyślij';
                                return;
                            }else if( data.gateError ){
                                var localeMessage = chrome.i18n.getMessage("error_send_processor_"+data.gateError);
                                var msg = chrome.i18n.getMessage("error", [localeMessage]);
                                alert(msg);
                                button.removeClass('buttonSending');
                                button.removeAttribute( 'disabled' , true);
                                button.innerHTML = 'Wyślij';
                            } else {
                                UI.closeDialog();
                            }
                        },
                        error: function(data){
                            alert("Wystąpił błąd wysyłania wiadomości");
                            console.error(data);
                        }
                    });
                } catch(e){
                    if( e instanceof NotLoggedInException ){
                        alert('Nie jesteś zalogowany a aplikacji :(');
                    } else {
                        alert( 'Wystąpił błąd. Nie mogę wysłąć wiadomości.' );
                    }
                    button.removeClass('buttonSending');
                    button.removeAttribute( 'disabled' , true);
                    button.innerHTML = 'Wyślij';
                }
            }

            context.db.transaction(function(tx) {
                tx.executeSql("SELECT c.name,p.number FROM contacts as c JOIN phones as p ON p.contact_id = c.id WHERE p.id = ? LIMIT 1", [phoneId], function(tx,res){
                    var item = res.rows.item(0);
                    UI.dialog( {
                        width: 400,
                        height: 400,
                        content: document.getElementById("send-sms-dialog"),
                        title: 'Wyślij wiadomość do ' + item.name + " (" + item.number + ")",
                        buttons: [
                            {label:'Wyślij wiadomość',action:function(e){return handler.apply(context, [e,item]);},type:'button'},
                            {label:'Anuluj',action:function(e){e.preventDefault();UI.closeDialog();},type:'link'}
                        ]
                    } );
                    var body = document.querySelector('div.dialog-content form.send-text-form textarea');
                    body.addEventListener( 'keyup' , inputBodyHandler);
                    body.focus();
                }, null);
            });
        }
    }
    
    icon.addEventListener( 'click', function(e){return sendSmsCallback.call(context,icon, phoneId)});

    
}
Contacts.prototype.observeDeleteAction = function(element, editId){
    var context = this;
    element.addEventListener('click', function(){
        UI.dialog( {
            width: 400,
            height: 200,
            content: '<p>Czy na pewno usun\u0105ć ten kontakt i powiązane z nim informacje takie jak historia, numery telefonów?</p>',
            title: 'Usu\u0144 kontakt',
            buttons: [
                {label:'Usu\u0144',action:function(){
                        UI.closeDialog();
                        var row = document.querySelector('table.contacts-table tr#row-'+editId);
                        row.className += ' remove';
                        window.setTimeout(function(){
                            row.parentNode.removeChild(row);
                        }, 250);
                        context.deleteContact(editId);
                },type:'button'},
                {label:'Anuluj',action:function(e){e.preventDefault();UI.closeDialog();},type:'link'}
            ]
        } );
    });
}


Contacts.prototype.observePhoneField = function(element,editId){
    function observerIn(e,elementID,ContactsContext){
        e.preventDefault();
        var fieldsContainer = this.getParent('div.contact-phone-item')
        fieldsContainer.style.display = 'none';
        var parentTD = this.getParent('div.contact-phone-wrapper');
        var input = document.createElement('input');
        input.type = 'tel';
        input.value = element.innerHTML;
        input.className = 'name-edit';
        parentTD.appendChild( input );
        var callbackOut = function(e){return observerOut.call(this,e,elementID,ContactsContext);}
        input.addEventListener('mouseout', callbackOut);
        input.addEventListener('blur', callbackOut);
        input.addEventListener('focus', function(){this.focused = true;});
        input.addEventListener('blur', function(){this.focused = false;});
        input.addEventListener('keydown', function(e){
            if(e.keyCode == 13){
                this.blur();
                //callbackOut(e);
            }
        });
        if( !(e instanceof MouseEvent) ){ //wymuszone prze kliknięcie w ikonę
            input.focus();
        }
    }
    function observerOut(e,elementID,ContactsContext){
        if( this.hasFocus() && e.type && e.type != 'blur' ){
            return false;
        }
        e.preventDefault();
        var newValue = this.value;
        var marker = this.getParent('div.contact-phone-wrapper');
        if( marker != null ){
            if( NumberFormatter.checkFormat( newValue ) ){
                newValue = NumberFormatter.formatNumber( newValue );
                var index = marker.className.indexOf('validate-error');
                if( index != -1 ){
                    marker.className = marker.className.replace(/(\s)?validate\-error/gi, '');
                }
            } else {
                if( marker.className.indexOf('validate-error') == -1 ){
                    marker.className += ' validate-error';
                }
                return false;
            }
        }
        if( this.parentNode == null ) return false;
        var span = this.parentNode.querySelector('span.number-holder');
        var parentDiv = this.getParent('div.contact-phone-wrapper');
        if( newValue != span.innerHTML ){
            span.innerHTML = newValue;
            ContactsContext.updateNumber(elementID, newValue);
        }
        this.parentNode.removeChild(this);
        parentDiv.querySelector('div.contact-phone-item').style.display = 'block';
        return true;
    }
    var context = this;
    var callbackIn = function(e){return observerIn.call(this,e,editId,context);}
    element.addEventListener('mouseover', callbackIn);
}

/**
 * Obserwowanie elemenu z nawą kontaktu.
 * Po najechaniu na nazwę powinien się otworzyć inline editor
 * umożliwiający edycję danych
 * @param element {DOMObject} Element DOM do którego dodane będą event listenery
 * @param editIds {Integer} ID z bazy kontaktów, którego dotyczy zmiana
 */
Contacts.prototype.observeNameField = function(element, editIds){
    function observerIn(e,elementID,ContactsContext){
        e.preventDefault();
        this.style.display = 'none';
        var parentTD = this.getParent('td.td-name');
        var tmp_class = parentTD.className;
        parentTD.className += ' nopointer';
        parentTD.orygClasses = tmp_class;

        var input = document.createElement('input');
        input.type = 'text';
        input.value = this.innerHTML;
        input.className = 'name-edit';
        parentTD.appendChild( input );

        var callbackOut = function(e){return observerOut.call(this,e,elementID,ContactsContext);}

        input.addEventListener('mouseout', callbackOut);
        input.addEventListener('blur', callbackOut);
        input.addEventListener('focus', function(){this.focused = true;});
        input.addEventListener('blur', function(){this.focused = false;});
        input.addEventListener('keydown', function(e){
            if(e.keyCode == 13){
                this.blur();
            }
        });
    }
    function observerOut(e,elementID,ContactsContext){
        if( this.hasFocus() && e.type && e.type != 'blur' ){
            return false;
        }
        e.preventDefault();
        var newValue = this.value;
        if( this.parentNode == null ) return false;
        var span = this.parentNode.querySelector('span.contact-name');
        var td = this.getParent('td.td-name');
        if(td){
            td.className = td.orygClasses;
        }
        if( newValue != span.innerHTML ){
            span.innerHTML = newValue;
            ContactsContext.updateName(elementID, newValue);
        }
        this.parentNode.removeChild(this);
        span.style.display = 'block';
        return true;
    }
    var context = this;
    var callbackIn = function(e){return observerIn.call(this,e,editIds,context);}
    element.addEventListener('mouseover', callbackIn);
}
Contacts.prototype.updateName = function(id, name){
    this.db.transaction(function(tx) {
        tx.executeSql("UPDATE contacts SET name = ? WHERE id = ?", [name, id], null, null);
    });
}
Contacts.prototype.updateNumber = function(id, num){
    this.db.transaction(function(tx) {
        tx.executeSql("UPDATE phones SET number = ? WHERE id = ?", [num, id], null, null);
    });
}
Contacts.prototype.deleteContact = function(id){
    this.db.transaction(function(tx) {
        tx.executeSql("DELETE FROM contacts WHERE id = ?", [id], null, function(tx,err){console.log('rem contact:',tx,err);});
        tx.executeSql("DELETE FROM phones WHERE contact_id = ?", [id], null, function(tx,err){console.log('rem phones:',tx,err);});
        tx.executeSql("DELETE FROM history WHERE contact_id = ?", [id], null, function(tx,err){console.log('rem history:',tx,err);});
    });
}
Contacts.prototype.noContactsInfo = function(){
    var progress = document.querySelector("div.contacts-loader");
    progress.parentNode.removeChild(progress);
    var txt = "Lista kontaktów jest pusta...";
    var p = document.createElement('p');
    p.innerHTML = txt;
    p.className = 'no-contact-info';
    document.querySelector('div.contacts-table').appendChild( p );
}
var contactsObject = new Contacts();

function Gate(){}

Gate.cost = {
    sms:18,
    mms:36
}
Gate.signs = {
    sms:160,
    mms:-1
}
Gate.maxSigns = {
    sms:1600,
    mms:-1
}
Gate.type = 'sms';