
function Gate(){
    
    chrome.tabs.getCurrent(function(tab){
        if( typeof tab != 'undefined' ){ //is not popup
            document.querySelector("span.open-window").addClass("hidden");
        }
    });
    
    this.init();
}

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

Gate.prototype.init = function(){
    var history = localStorage.historyEnabled||true;
    if(!history){
        var hist_lnk = document.getElementById('hitory-lnk');
        hist_lnk.parentNode.removeChild(hist_lnk);
    }

    
    if( VARS.contextNum ){
        document.getElementById('sendTo').value = VARS.contextNum;
        document.getElementById('tel_num_txt_cont').style.display = 'block';
        VARS.contextNum = null;
        chrome.extension.getBackgroundPage().VARS = VARS;
    }
    if( VARS.contextSelection ){
        document.getElementById('body').value = VARS.contextSelection;
        VARS.contextSelection = null;
    }

    this.loadContacts();
    this.observers();
}
Gate.prototype.observers = function(){

    function inputBodyHandler(e){
        var str = StringFormatter.formatMessageLocale( this.value );
        document.getElementById("char_cnt").innerHTML = str.length;
        var max = Gate.maxSigns[Gate.type];
        if(max != -1){
            if(str.length > max){
                str = str.substr(0,max);
            }
            document.getElementById("char_left").innerHTML = (max-str.length);
        }
        var signs_per_one = Gate.signs[Gate.type];
        var one_cost = Gate.cost[Gate.type];
        var _x = Math.floor(str.length/signs_per_one);
        if( str.length%signs_per_one != 0 ){
            _x++;
        }
        document.getElementById("sms_cnt").innerHTML = _x;
        document.getElementById("cost_txt").innerHTML = (_x*one_cost)+" \u017cetonów";
        this.value = str;
    }

    var body = document.getElementById( 'body' );
    body.addEventListener( 'keyup' , inputBodyHandler);

    var context = this;

    document.getElementById("send-form").addEventListener('submit', function(e){
        e.preventDefault();
        var inputs = this.querySelectorAll('input:not(*[type="submit"]):not(button), textarea');
        var _inp_cnt = inputs.length;
        if( !this.checkValidity() ){
            for( var i=0;i<_inp_cnt;i++ ){
                if( inputs[i].checkValidity() ){
                    inputs[i].removeClass('validate-error');
                } else {
                    inputs[i].addClass('validate-error');
                }
            }
            this.querySelector('input[type="submit"]').addClass('validate-error');
            return false;
        } else {
            for( var i=0;i<_inp_cnt;i++ ){
                if( inputs[i].hasClass('validate-error') ){
                    inputs[i].removeClass('validate-error');
                }
            }
        }
        var submitButton = document.querySelector('#send-form input[type="submit"]');
        submitButton.setAttribute('disabled', true);
        var recipient = document.getElementById('sendTo').value;
        var body = document.getElementById('body').value;
        var sp = new SendProcessor({
            body:body,
            recipient:recipient
        });
        var logger = document.getElementById('log');
        try{
            sp.sendSms({
                success: function(data){
                    submitButton.removeAttribute('disabled');
                    if( data.error && data.error.code ){
                        context.showError(data.error.code);
                        return;
                    }else if( data.gateError ){
                        context.showGateError(data.gateError);
                    } else {
                        logger.innerHTML = '';
                        logger.style.display = 'none';
                    }
                    document.getElementById("last_message_cost").innerHTML = data.cost + " żetonów";
                    document.getElementById("balance_txt").innerHTML = data.tokens_left + ' żetonów';
                    document.getElementById("lastOperation").style.display = 'block';
                },
                error: function(data){
                    submitButton.removeAttribute('disabled');
                    logger.innerHTML = 'Wystąpił błąd komunikacji. Proszę spróować później';
                    logger.style.display = 'block';
                    console.log(data);
                }
            });
        } catch(e){
            if( e instanceof NotLoggedInException ){
                logger.innerHTML = 'Nie jesteś zalogowany a aplikacji :(';
                logger.style.display = 'block';
            } else {
                logger.innerHTML = 'Wystąpił błąd. Nie mogę wysłąć wiadomości.';
                logger.style.display = 'block';
            }
        }
        return false;
    }, false);
    var callback = function(e){
        e.preventDefault();
        return context.checkAccountBalance.call(context);
    }
    document.querySelector("img.popup-refresh-balance").addEventListener('click', callback);
    document.getElementById("save-contact-lnk").addEventListener('click', function(e){
        e.preventDefault();
        var value = document.getElementById("sendTo").value;
        if( value != "" ){
            chrome.tabs.create({
                url:chrome.extension.getURL('contacts.html?insert='+value)
                });
        }
        return false;
    });

}
Gate.prototype.checkAccountBalance = function(){
    var bg = chrome.extension.getBackgroundPage();
    var app = bg.eraApp;
    var context = this;
    var nfo = document.getElementById("balance_txt");
    nfo.innerHTML = 'ładowanie...';
    document.getElementById('loader').style.display='block';
    app.sendToApp(VARS.checkBalanceUrl, null, function(status){
        document.getElementById('loader').style.display = 'none';

        if( !isNaN(status) ){
            status = parseInt(status, 10);
            context.showError(status);
            return;
        } else {
            status = JSON.parse(status);
            var points = 0;
            try{
                points = parseInt( status["tokens_left"] );
            }catch(e){}
            
            nfo.innerHTML = points + ' \u017cetonów';
            if( points<=80 ){//5 smsów
                nfo.className = 'low-warning';
            }
        }
    }, 'GET');
}
Gate.prototype.loadContacts = function(){
    var context = this;
    function selectChangeChandler(e){
        return (function(){
            var oauth = chrome.extension.getBackgroundPage().oauth;
            var val = this.options[this.selectedIndex].value;
            if( val == "0" || val == "-1"){
                document.getElementById("tel_num_txt_cont").style.display = 'block';
                if( oauth !=null && oauth.hasToken() )
                    document.querySelector('div.thumb_contact_image').innerHTML = '';
            } else {
                document.getElementById("tel_num_cont").style.display = 'block';
                document.getElementById("tel_num_txt_cont").style.display = 'none';
                document.getElementById("sendTo").value = val;
                if( oauth != null && oauth.hasToken() ){
                    context.loadContactThumb(val);
                }
            }
        }).apply(this);
    }

    var select = document.getElementById("tel_numbers");
    var option = document.createElement('option');
    option.setAttribute('value', 0);
    option.innerHTML = 'wpisz r\u0119cznie';
    select.appendChild(option);
    select.addEventListener('change', selectChangeChandler);

    var query = "SELECT c.ID, c.photo, c.name, p.ID AS pid, p.number FROM contacts AS c ";
    query += "JOIN phones AS p ON c.ID = p.contact_id ";
    query += "WHERE 1 ORDER BY c.name";
    var callback = function(tx, result){
        return context.queryHandler.call(context, tx, result);
    }
    var db = DatabaseHelper.getConnection();
    db.transaction(function(tx) {
        tx.executeSql(query,[],callback,function(tx,err){
            console.error('query error',err)
            });
    });
}
Gate.prototype.queryHandler = function(tx, result){
    var worker = new Worker('js/contacts_worker.js');
    worker.onerror = function(event){
        throw new Error(event.message + " (" + event.filename + ":" + event.lineno + ")");
    }
    var context = this;
    var callback = function(event){
        return context.appendContacts.call(context, event);
    }
    worker.onmessage = callback;
    var cnt = result.rows.length;
    if( cnt != 0 ){
        for( var i=0, item=null; i< cnt; i++ ){
            item = result.rows.item(i);
            worker.postMessage(item);
        }
        worker.postMessage('start');
    }
}
Gate.prototype.appendContacts = function(event){
    if( typeof event.data == 'object' && event.data.length > 0 ){
        var contacts = event.data;
        //[{name:'name',photo:'photo',phone:[{id:'ID',number:''NO},(n...)]}]
        var len = contacts.length;
        var select = document.getElementById("tel_numbers");
        for( var i=0; i<len; i++ ){
            var contact = contacts[i];
            var phonesCnt = contact.phone.length;
            if( phonesCnt == 1 ){
                var option = document.createElement('option');
                option.setAttribute('value', contact.phone[0].number);
                option.innerHTML = contact.name + ' (' + contact.phone[0].number + ')';
                select.appendChild( option );
            } else {
                var optGrp = document.createElement('optgroup');
                optGrp.setAttribute('label', contact.name);
                for( var j=0;j<contact.phone.length;j++ ){
                    var opt = document.createElement('option');
                    opt.setAttribute('value', contact.phone[j].number);
                    opt.innerHTML = contact.phone[j].number;
                    optGrp.appendChild( opt );
                }
                select.appendChild( optGrp );
            }
        }
    }
}
Gate.prototype.showGateError = function(msg){
    var logger = document.getElementById('log');
    if( typeof msg == 'number' ){
        var localeMessage = chrome.i18n.getMessage("error_send_processor_"+msg);
        msg = chrome.i18n.getMessage("error", [localeMessage]);
    }
    logger.innerHTML = msg;
    logger.style.display = 'block';
}
Gate.prototype.showError = function(msg){
    var logger = document.getElementById('log');
    if( typeof msg == 'number' ){
        var localeMessage = chrome.i18n.getMessage("error_"+msg);
        msg = chrome.i18n.getMessage("error", [localeMessage]);
    }
    logger.innerHTML = msg;
    logger.style.display = 'block';
}
Gate.prototype.loadContactThumb = function(phone){
    var _t = this;
    var db = DatabaseHelper.getConnection();
    db.transaction(function(tx) {
        var query = "SELECT C.photo FROM contacts as C JOIN phones as P ON C.ID = P.contact_id WHERE P.number = ?";
        tx.executeSql(query, [phone],function(tx, result){
            if(result.rows.length == 0){
                return;
            }
            var contact = result.rows.item(0);
            if( !contact.photo ) {
                document.querySelector('div.thumb_contact_image').innerHTML = '';
                return;
            }

            var img = new Image();
            var oauth = chrome.extension.getBackgroundPage().oauth;
            img.src = oauth.signURL(contact.photo,'GET',{});
            img.className = 'contact-photo-thumb';
            document.querySelector('div.thumb_contact_image').innerHTML = '';
            document.querySelector('div.thumb_contact_image').appendChild(img);

        },function(tx, error){
            alert(error.message);
        } )
    });
}