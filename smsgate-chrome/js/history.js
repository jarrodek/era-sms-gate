function SmsHistory(){
    this.data = [];
    this.historyTable = document.querySelector('table.history-table');

    var title = chrome.i18n.getMessage( 'history_page_title' );
    document.title = title;

    var lastSynchDate = "";
    
    if( !localStorage.historyEnabled || localStorage.historyEnabled == "false" ){
        lastSynchDate = "Synchronizacja jest wyłączona";
    } else {
        if( !localStorage.historyAppUpdate || localStorage.historyAppUpdate == 0 ){
            lastSynchDate = "jeszcze nie synchronizowano";
        } else {
            lastSynchDate = TimeFormatter.parseLongDate( localStorage.historyAppUpdate, true );
        }
    }
    document.getElementById("last-synch").innerHTML = lastSynchDate;
}
SmsHistory.prototype.init = function(){

    if( document.location.search != "" ){
        var params = parseGETParams(document.location.search);
        if( "show" in params ){
            this.showContactHistory( params["show"] );
        }
    }

    MenuBuilder.build();
    var self = this;
    var db = DatabaseHelper.getConnection();
    db.transaction(function(tx) {
        
        var query = "SELECT count(*) as count, History.ID, History.number as h_number, History.body, "
        query += "max(History.sent) as sent, Contact.name, Phone.number, Contact.ID as CID "
        query += "FROM history as History LEFT OUTER JOIN contacts as Contact ON Contact.ID = History.contact_id "
        query += "LEFT OUTER JOIN phones as Phone ON Phone.ID = History.number_id "
        query += "GROUP BY History.contact_id, History.number  ORDER BY History.sent DESC";
        tx.executeSql(query,[],handleData, function(a,b){console.log('err',a,b);});
    });

    document.querySelector('span.remove-history-all').addEventListener('click', deleteSelectedMessages);

    function handleData(tx, result){
        if(result.rows.length != 0){
            for (var i = 0, item = null; i < result.rows.length; i++) {
                item = result.rows.item(i);
                self.data[self.data.length] = item;
            }
            self.loadData();
        }else {
            setEmptyListBody();
        }
    }

    function deleteSelectedMessages(){

        var remoteDelete = document.getElementById("remote-remove").checked;

        var checked = document.querySelectorAll('td.select-checkbox-column > input[type="checkbox"]:checked');
        var len = checked.length;
        for (var i = 0; i < len; i++) {
            var parent = checked[i].getParent('tr');
            var params = {
                number:parent.dataset['number'],
                ID:parent.dataset['cid']
            }
            parent.parentNode.removeChild(parent);

            db.transaction(function(tx) {
                 if( remoteDelete ){
                    //get message hashes
                    var qSelect = "SELECT hash FROM history WHERE contact_id = ? OR number = ? AND hash IS NOT NULL";
                    tx.executeSql(qSelect,[this.ID,this.number],function(tx,res){
                        if(res.rows.length > 0){
                            var bg = chrome.extension.getBackgroundPage();
                            var hashes = "&payload=remove";
                            for (var i = 0, item = null; i < res.rows.length; i++) {
                                item = res.rows.item(i);
                                hashes += "&h[]="+item.hash;
                                if( i%30 == 0 ){
                                    bg.eraApp.sendToApp(VARS.historyUrl+hashes,null,function(){},'DELETE');
                                    hashes = "&payload=remove";
                                }
                            }
                            if( hashes != "&payload=remove" )
                                bg.eraApp.sendToApp(VARS.historyUrl+hashes,null,function(){},'DELETE');

                            var query = "DELETE FROM history WHERE contact_id = ? OR number = ?";
                            tx.executeSql(query,[this.ID,this.number],function(){},function(tx,error){console.error(error);});
                        }
                    }.bind(this),function(tx,error){console.error(error);});
                } else {
                    var query = "DELETE FROM history WHERE contact_id = ? OR number = ?";
                    tx.executeSql(query,[this.ID,this.number],function(){},function(tx,error){console.error(error);});
                }
                
                
            }.bind(params));
        }


        if( document.querySelector('table.history-table > tr') == null ){
            setEmptyListBody();
        }

    }
    function setEmptyListBody(){
        var table = document.querySelector('table.history-table');
        var tr = document.createElement('tr');
        var td = document.createElement('td');
        var em = document.createElement('em');
        td.colspan = 4;
        td.className = "no-items-info";
        td.align = "center";
        em.innerHTML = 'Brak zapisanych wiadomości.';
        td.appendChild(em);
        tr.appendChild(td);
        table.appendChild( tr );
    }

    function historyAddEvent(e){
        var data = e.data;
        var closedRow = document.querySelector('table.history-table > tr[data-number="'+data.recipient+'"]');
        var openedTab = null;
        if( data.contact_id )
            openedTab = document.querySelector('table.history-table > tr.history-list[data-cid="'+data.contact_id+'"]');
        else
            openedTab = document.querySelector('table.history-table > tr.history-list[data-number="'+data.recipient+'"]');
        
        if( openedTab != null ){
            data.CID = data.contact_id;
            data.sent = data.time;
            data.number = data.recipient;
            this.insertHistoryItemData(data);
        }
        if( closedRow != null ){
            var body = closedRow.querySelector('td.history-body-column > div');
            var sent = closedRow.querySelector('td.history-date-column > div');
            body.innerHTML = data.body;
            sent.innerHTML = TimeFormatter.parseLongDate( data.time, true );
        }
        //console.dir(data);
        if( openedTab == null && closedRow == null ){
            //new history item
            var db = DatabaseHelper.getConnection();
            db.transaction(function(tx) {
                var query = "SELECT count(*) as count, History.ID, History.number as h_number, History.body, "
                query += "max(History.sent) as sent, Contact.name, Phone.number, Contact.ID as CID "
                query += "FROM history as History LEFT OUTER JOIN contacts as Contact ON Contact.ID = History.contact_id "
                query += "LEFT OUTER JOIN phones as Phone ON Phone.ID = History.number_id "
                query += "WHERE Contact.ID = ? "
                query += "GROUP BY History.contact_id";
                tx.executeSql(query,[data.contact_id],function(tx,result){
                    var item = result.rows.item(0);
                    self.appendHistoryRow(item, true);
                }, function(a,b){console.error('err',a,b);});
            });

        }
    }


    var bg = chrome.extension.getBackgroundPage();
    var hnd = historyAddEvent.bind(this);
    bg.AppEvents.observe('history.append', hnd);
    document.body.onunload = function(e){
        bg.AppEvents.unobserve('history.append', hnd);
    };
}
SmsHistory.prototype.showContactHistory = function(contactId){
    var bg = chrome.extension.getBackgroundPage();
    bg.AppEvents.observe('history.pageLoaded',function(e){

        var contactRow = document.querySelector('tr[data-cid="' + contactId + '"]');
        if( !contactRow ){
            UI.dialog( {
                width: 400,
                height: 200,
                content: "<p><strong>Brak historii konwersacji</strong></p>Zamknij okno aby przejść do wszystkich kontaktów.",
                title: 'Historia rozmów',
                buttons: [
                    {label:'Zamknij okno',action:function(){
                        UI.closeDialog();
                    },type:'button'}
                ]
            } );
            return;
        }
        var header = document.querySelectorAll('tr:not(*[data-cid="' + contactId + '"])');
        var cnt = header.length;
        for( var i=0; i <cnt; i++ ){
            header[i].style.display = 'none';
        }
        var button = document.querySelector("span.gradient-button.show-history-all");
        button.style.display = 'inline';
        button.addEventListener('click', function(){
            this.style.display = 'none';
            for( var i=0; i <cnt; i++ ){
                header[i].style.display = 'table-row';
            }
        });
    });
}
SmsHistory.prototype.loadData = function(){
    for( var i=0, l=this.data.length; i<l; i++ ){
        var item = this.data[i];
        this.appendHistoryRow(item);
    }
    var bg = chrome.extension.getBackgroundPage();
    bg.AppEvents.fire('history.pageLoaded', {});
}
SmsHistory.prototype.appendHistoryRow = function(item, prepend){
    prepend = prepend || false;
    var row = document.createElement('tr');
    var checkbox_col = document.createElement('td');
    var name_col = document.createElement('td');
    var body_col = document.createElement('td');
    var date_col = document.createElement('td');
    checkbox_col.className = 'select-checkbox-column';
    name_col.className = 'contant-name-column';
    body_col.className = 'history-body-column';
    date_col.className = 'history-date-column';

    row.appendChild(checkbox_col);
    row.appendChild(name_col);
    row.appendChild(body_col);
    row.appendChild(date_col);


    if( prepend ){
        var firstTr = this.historyTable.querySelector('tr');
        this.historyTable.insertBefore(row, firstTr);
    } else {
        this.historyTable.appendChild(row);
    }
    

    name_col.addEventListener('click', listElementClickHandler);
    body_col.addEventListener('click', listElementClickHandler);
    date_col.addEventListener('click', listElementClickHandler);

    row.setAttribute('data-number',item.h_number);
    row.setAttribute('data-dbid',item.ID);
    row.setAttribute('data-cid',item.CID);

    var checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = 'his-' + item.ID;
    checkbox_col.appendChild(checkbox);
    checkbox.addEventListener('change', checkboxChangeHandler);
    var name_wrapper = document.createElement('div');
    name_wrapper.innerHTML = (item.name||item.h_number);
    name_col.appendChild(name_wrapper);

    var body_wrapper = document.createElement('div');
    body_wrapper.innerHTML = decodeURI(item.body);
    body_col.appendChild(body_wrapper);

    var date_wrapper = document.createElement('div');
    date_wrapper.innerHTML = TimeFormatter.parseDate(item.sent);
    date_col.appendChild(date_wrapper);

    var self = this;

    function checkboxChangeHandler(e){
        var row = this.getParent( "tr" );
        if( this.checked ){
            row.addClass('selected');
        } else {
            row.removeClass('selected');
        }
    }
    function listElementClickHandler( e ){
        var opened = this.getAttribute('opened');
        if( opened ) return;

        var parent = this.getParent( 'tr' );
        var checkbox = parent.querySelector("input[type='checkbox']:checked");
        if( checkbox )
            checkbox.checked = false;
        this.setAttribute('opened', true);

        var contact_id = parent.dataset['cid'];
        if(contact_id=="null"){
            self.loadContactMessages(null,parent.dataset['number']);
        } else {
            self.loadContactMessages(contact_id);
        }
    }
}

SmsHistory.prototype.loadContactMessages = function(contact_id,number){
    var querySelector = 'tr[data-cid="' + contact_id + '"]';
    var useNumber = false;
    if( number ){
        querySelector = 'tr[data-number="' + number + '"]';
        useNumber = true;
    }
    var header = document.querySelector(querySelector);
    var next = header.nextSibling;

    var progress = document.createElement('progress');
    progress.className = 'load-progress';
    progress.innerHTML = 'ładowanie...';

    var row = document.createElement('tr');
    var col = document.createElement('td');
    col.setAttribute('colspan', 4);
    col.className = "history-opened-col";
    row.appendChild(col);
    row.className = 'history-list loading';
    if( !useNumber )
        row.setAttribute('data-cid', contact_id);
    else
        row.setAttribute('data-number', number);
    col.appendChild(progress);
    header.parentNode.insertBefore(row, next);

    if(useNumber){
        this.getNumberMessages(number);
    } else {
        this.getContactMessages(contact_id);
    }
}
SmsHistory.prototype.getNumberMessages = function(number){
    var db = DatabaseHelper.getConnection();
    function handleData(tx, result){
        var progress = document.querySelector('progress.load-progress');
        var header = document.querySelector('tr[data-number="' + number + '"]');
        var row = document.querySelector('tr.history-list.loading[data-number="' + number + '"]');

        var cnt = result.rows.length;
        progress.setAttribute('max', cnt);
        progress.setAttribute('value', 0);
        if(cnt > 0){
            for (var i = 0, item = null; i < cnt; i++) {
                item = result.rows.item(i);
                if(i==0){
                    this.insertOpenedHeader(item);
                }
                this.insertHistoryItemData(item);
                progress.setAttribute('value', (i+1));
            }
            header.style.display = 'none';
            progress.parentNode.removeChild(progress);
            row.className = 'history-list';
        }
    }
    function getTransaction(tx){
        var query = "SELECT History.ID, History.number, History.body, History.sent, History.cost, Contact.name, Contact.ID as CID " +
            "FROM history as History " +
            "LEFT OUTER JOIN contacts as Contact ON Contact.ID = History.contact_id " +
            "LEFT OUTER JOIN phones as Phone ON History.number_id = Phone.ID " +
            "WHERE History.number = ?" +
            "ORDER BY History.sent DESC";
        tx.executeSql(query,[number],handleData.bind(this), function(a,b){console.log('err',a,b);});
    }
    db.transaction( getTransaction.bind(this) );
}
SmsHistory.prototype.getContactMessages = function(contact_id){
    
    function handleData(tx, result){
        var progress = document.querySelector('progress.load-progress');
        var header = document.querySelector('tr[data-cid="' + contact_id + '"]');
        var row = document.querySelector('tr.history-list.loading[data-cid="' + contact_id + '"]');
        
        var cnt = result.rows.length;
        progress.setAttribute('max', cnt);
        progress.setAttribute('value', 0);
        if(cnt > 0){
            for (var i = 0, item = null; i < cnt; i++) {
                item = result.rows.item(i);
                if(i==0){
                    this.insertOpenedHeader(item);
                }
                this.insertHistoryItemData(item);
                progress.setAttribute('value', (i+1));
            }
            header.style.display = 'none';
            progress.parentNode.removeChild(progress);
            row.className = 'history-list';
        }
    }
    var db = DatabaseHelper.getConnection();
    
    function getTransaction(tx){
        var query = "SELECT History.ID, History.number, History.body, History.sent, History.cost, Contact.name, Contact.ID as CID " +
            "FROM history as History " +
            "LEFT OUTER JOIN contacts as Contact ON Contact.ID = History.contact_id " +
            "LEFT OUTER JOIN phones as Phone ON History.number_id = Phone.ID " +
            "WHERE Contact.ID = ?" +
            "ORDER BY History.sent DESC";
        tx.executeSql(query,[contact_id],handleData.bind(this), function(a,b){console.log('err',a,b);});
    }
    db.transaction( getTransaction.bind(this) );
}
SmsHistory.prototype.insertOpenedHeader = function(item){
    
    var wrapper = document.createElement('div');
    wrapper.className = 'message-header';
    var msgName = document.createElement('span');
    msgName.className = 'message-name';
    msgName.innerHTML = (item.name||item.number);
    msgName.setAttribute('data-number', item.number);
    if( item.CID )
        msgName.setAttribute('data-cid', item.CID);
    msgName.setAttribute('data-dbid', item.ID);
    wrapper.appendChild(msgName);
    var query = item.CID ? 'tr.history-list.loading[data-cid="' + item.CID + '"] > td.history-opened-col' :
        'tr.history-list.loading[data-number="' + item.number + '"] > td.history-opened-col';
    var col = document.querySelector(query);
    col.appendChild(wrapper);
    msgName.addEventListener('click', this.sendSmsToContact);//.bind(this)
}
SmsHistory.prototype.insertHistoryItemData = function(item){
        var itemTime = TimeFormatter.getTime(item.sent);
        var wrapper = document.createElement('div');
        wrapper.setAttribute('data-dbid', item.ID);
        wrapper.setAttribute('data-cid', item.CID);
        wrapper.setAttribute('data-time', itemTime);
        wrapper.className = 'message-wrapper';
        var msgBody = document.createElement('blockquote');
        msgBody.className = 'message-body';
        msgBody.innerHTML = decodeURI(item.body).replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, '$1<br/>$2');
        var msgDelete = document.createElement('span');
        msgDelete.className = 'message-delete info no-button';
        msgDelete.innerHTML = 'usuń';

        var properties = document.createElement("div");
        properties.className = "history-properties";
        var date = document.createElement('div');
        date.innerHTML = 'Wysłano: ' + TimeFormatter.parseLongDate(item.sent,true);
        var cost = document.createElement('div');
        cost.innerHTML = 'Koszt: ' + item.cost;
        var del = document.createElement('div');
        del.appendChild( msgDelete );

        properties.appendChild(date);
        properties.appendChild(cost);
        properties.appendChild( del );
        wrapper.appendChild(properties);

        wrapper.appendChild(msgBody);
        //var col = document.querySelector('tr.history-list[data-cid="' + item.CID + '"] > td.history-opened-col');
        var query = item.CID ? 'tr.history-list[data-cid="' + item.CID + '"] > td.history-opened-col' :
            'tr.history-list[data-number="' + item.number + '"] > td.history-opened-col';
        var col = document.querySelector(query);
        var current = col.querySelectorAll("div.message-wrapper");
        var _el = null;
        for (var i = 0; i < current.length; i++) {
            var item_time = parseInt( current[i].dataset['time'], 10) ;
            if( itemTime > item_time ){
                _el = current[i];
                break;
            }
        }
        if( !_el )
            col.appendChild(wrapper);
        else{
            _el.parentNode.insertBefore(wrapper, _el);
        }

        msgDelete.addEventListener('click', function(id){
            var row = document.querySelector('div.message-wrapper[data-dbid="' + id + '"]');
            row.style.display = 'none';
            var parent = row.parentNode;
            parent.removeChild(row);
            if(parent.lastChild.hasClass('message-header')){
                var el = parent.parentNode;
                el.parentNode.removeChild(el);
            }
            this.remove(id);
        }.bind(this,item.ID));
    
}
SmsHistory.prototype.sendSmsToContact = function(){
    if( this.dataset['cid'] )
        SenderBox.createBox(this.dataset['cid']);
    else{
        SenderBox.createFromNumber(NumberFormatter.formatNumber(this.dataset['number']));
    }
}
SmsHistory.prototype.remove = function(id){
    var db = DatabaseHelper.getConnection();
    var remoteDelete = document.getElementById("remote-remove").checked;
    var query = "DELETE FROM history WHERE ID = ?";
    db.transaction(function(tx) {
         if( remoteDelete ){
            var qSelect = "SELECT hash FROM history WHERE ID = ? AND hash IS NOT NULL";
            tx.executeSql(qSelect,[id],function(tx,res){
                if(res.rows.length > 0){
                    var bg = chrome.extension.getBackgroundPage();
                    var hashes = "&payload=remove";
                    var item = res.rows.item(0);
                    hashes += "&h[]="+item.hash;
                    bg.eraApp.sendToApp(VARS.historyUrl+hashes,null,function(){},'DELETE');
                    tx.executeSql(query,[id],function(){},function(tx,error){console.error(error);});
                }
            });
         } else {
            tx.executeSql(query,[id],function(){},function(tx,error){console.error(error);});
         }
    });
}