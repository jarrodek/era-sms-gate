var NumberFormatter = {
    checkFormat: function(number){
        number = number.replace(/[\s-]/, '');
        var patt = /(\+)?(\d{2})?[7|6|5]{1}\d{8}$/;
        var result=patt.test(number);
        return result;
    },
    formatNumber: function(number){
        number = number.replace(/[\s-]/, '');
        number = number.replace('+', '');
        if( number.toString().length == 9 ){
            number = "48"+number;
        }
        return number;
    }
}
var StringFormatter = {
    uuid: function(){
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
            return v.toString(16);
        }).toUpperCase();
    },
    characters: [{"ą" : 'a',"ę" : 'e',"ó" : 'o',"ś" : 's',"ł" : 'l',"ż" : 'z',"ź" : 'z',"ć" : 'c',"ń" : 'n'}],
    formatMessageLocale: function(val){
        var cnt = val.length;
        var str = "";
        for(var i=0;i<cnt;i++){
            if( typeof StringFormatter.characters[0][val[i]] == "string" ){
                str += StringFormatter.characters[0][val[i]];
            } else {
                str += val[i];
            }
        }
        return str;
    }
}
var TimeFormatter = {
    /**
     * Sprawdza czy podana data to dzisiaj.
     * @param {Date, Number, String} time - obiekt Date, timestamp lub zapis daty możliwy do sparsowania
     * @alias TimeFormatter.isToday
     * @memberOf TimeFormatter
     */
    isToday: function(time){
        var d = TimeFormatter.getDateObj(time);
        var now = new Date();
        return ( (now.getDate() == d.getDate()) && (now.getMonth() == d.getMonth()) && (now.getFullYear() == d.getFullYear()) );
    },
    isYesterday: function(time){
        var d = TimeFormatter.getDateObj(time);
        var now = new Date();
        return ( (now.getDate()-1 == d.getDate()) && (now.getMonth() == d.getMonth()) && (now.getFullYear() == d.getFullYear()) );
    },
    isThisWeek: function(time){
        var d = TimeFormatter.getDateObj(time);
        var now = new Date();
        var dimm = Math.abs( d.getDate() - now.getDate() );
        var inWeek = false;
        if( dimm < 7 ){
            if( now.getDay() >= d.getDay() ){
                inWeek = true;
            }
        }
        return ( inWeek && (now.getMonth() == d.getMonth()) && (now.getFullYear() == d.getFullYear()) );
    },
    /**
     * Zwraca obiekt typu Date.
     * @param time - obiekt Date, timestamp lub zapis daty możliwy do sparsowania
     */
    getDateObj: function(time){
        var d = null;
        if(time instanceof Date){
            d = time;
        } else if( isNaN(time) ){
            d = new Date();
            d.setTime( Date.parse(time) );
        } else {
            d = new Date();
            d.setTime( time );
        }
        return d;
    },
    /**
     * Zamienia datę lub czas na lokalny string daty.
     * Jeśli data jest z dzisiaj
     * to pokazuje tylko czas.
     */
    parseLongDate:function(dateStr, showDays){
        showDays = showDays || false;
        var d = new Date();
        if( isNaN( dateStr ) ){
            d = Date.parse(dateStr);
        } else {
            d.setTime( dateStr );
        }

        var dateObj = new Date();
        dateObj.setTime(d);
        
        var result = '';
        if( TimeFormatter.isToday(dateObj) ){ //show time only
            result = sprintf('%02u:%02u',dateObj.getHours(),dateObj.getMinutes());
            if( showDays ){
                result = 'dziś, '+result;
            }
        } else { //show month + day
            if( showDays ){
                if( TimeFormatter.isYesterday(dateObj) ){
                    result = sprintf('Wczoraj, %02u:%02u',dateObj.getHours(),dateObj.getMinutes());
                }
            }
            if(result==""){
                var month = TimeFormatter.regional.monthNames[dateObj.getMonth()];
                var day = TimeFormatter.regional.dayNames[dateObj.getDay()].toLowerCase();
                result = sprintf('%s %s (%s), %02u:%02u:%02u',dateObj.getDate(),month,day,dateObj.getHours(),dateObj.getMinutes(),dateObj.getSeconds());
            }
        }
        return result;
    },
    getTime: function(dateStr){
        var d = new Date();
        if( isNaN( dateStr ) ){
            d.setTime( Date.parse(dateStr) );
        } else {
            d.setTime( dateStr );
        }
        return d.getTime();
    },
    regional : {
        monthNames: ['Styczeń','Luty','Marzec','Kwiecień','Maj','Czerwiec','Lipiec','Sierpień','Wrzesień','Październik','Listopad','Grudzień'],
        monthNamesShort: ['Sty','Lut','Mar','Kwi','Maj','Cze','Lip','Sie','Wrz','Paź','Lis','Gru'],
        dayNames: ['Niedziela','Poniedzialek','Wtorek','Środa','Czwartek','Piątek','Sobota'],
        dayNamesShort: ['Nie','Pn','Wt','Śr','Czw','Pt','So'],
        dayNamesMin: ['N','Pn','Wt','Śr','Cz','Pt','So']
    },
    parseDate: function(dateStr){
        var d = Date.parse(dateStr);
        var dateObj = new Date();
        dateObj.setTime(d);
        var result = '';
        if( TimeFormatter.isToday(dateObj) ){
            result = sprintf('Dziś, %02u:%02u',dateObj.getHours(),dateObj.getMinutes());
        } else if( TimeFormatter.isYesterday(dateObj) ){
            result = sprintf('Wczoraj, %02u:%02u',dateObj.getHours(),dateObj.getMinutes());
        } else { //show month + day
            result = TimeFormatter.regional.monthNamesShort[dateObj.getMonth()] + ' ' + dateObj.getDate();
        }
        return result;
    }
}
function parseGETParams(search){
    search = search.substr(1); //assuming ?xxx=yyy&aaa=bbb
    var params = search.split("&")
    var res = {};
    for( var i=0; i<params.length; i++ ){
        var _tmp = params[i].split("=");
        res[_tmp[0]] = _tmp[1];
    }
    return res;
}

DatabaseHelper = {
    /**
     * Bezpośrednie połączenie z bazą danych.
     * Nie należy używać go bezpośrednio.
     * Aby otrzymać referencję do DB należy użyć funkcji getConnection
     * @see DatabaseHelper.getConnection()
     */
    connection: null,
    /**
     * Zwraca uchwyt do bazy danych.
     * Jeśli wcześniej nie wywołano połączenia to zostaje ono uruchomione.
     */
    getConnection: function(){
        if( DatabaseHelper.connection == null )
            DatabaseHelper.loadDatabase();
        return DatabaseHelper.connection;
    },
    /**
     * Uruchamia połączenie z bazą danych i tworz ją jeśli wcześniej
     * nie utworzono bazy danych.
     */
    loadDatabase: function(){
        DatabaseHelper.connection = openDatabase('eraContacts', '', 'Era gate sms contacts', (5 * 1024 * 1024));
        if(DatabaseHelper.connection == null) return;
        
        if(DatabaseHelper.connection.version == ""){
            DatabaseHelper.connection.changeVersion('', '1.3', function (t) {
                //console.log("Create database.")
                t.executeSql('CREATE TABLE contacts (ID INTEGER PRIMARY KEY ASC, gid TEXT NULL, photo TEXT NULL, name TEXT, updated DATETIME)',[],null,function(tx, error){console.log(error.message);});
                t.executeSql('CREATE TABLE phones (ID INTEGER PRIMARY KEY ASC, contact_id INTEGER NULL, number INTEGER, updated DATETIME)',[],null,function(tx, error){console.log(error.message);});
                t.executeSql('CREATE TABLE history (ID INTEGER PRIMARY KEY ASC, contact_id INTEGER NULL, number_id INTEGER, body TEXT, sent DATETIME, cost INTEGER, `number` INTEGER NULL, `hash` TEXT NULL)',[],null,function(tx, error){console.log(error.message);});
                
            }, function (e) {console.error(e)});
        }
        if(DatabaseHelper.connection.version == "1.0"){
            DatabaseHelper.connection.changeVersion('1.0', '1.3', function (t) {
                console.log("Update database from v 1.0 to 1.3.");
                t.executeSql('ALTER TABLE `contacts` ADD `gid` TEXT NULL',[],null,function(tx, error){console.log(error.message);});
                t.executeSql('ALTER TABLE `contacts` ADD `photo` TEXT NULL',[],null,function(tx, error){console.log(error.message);});
                t.executeSql('ALTER TABLE `contacts` ADD `photo_etag` TEXT NULL',[],null,function(tx, error){console.log(error.message);});
                createV1p2(t);
                createV1p3(t);
            }, function (e) {console.error(e)});
        }
        if(DatabaseHelper.connection.version == "1.1"){
            DatabaseHelper.connection.changeVersion('1.1', '1.3', function (t) {
                console.log("Update database from v 1.1 to 1.2.");
                createV1p2(t);
                createV1p3(t);
            }, function (e) {console.error(e)});
        }
        if(DatabaseHelper.connection.version == "1.2"){
            DatabaseHelper.connection.changeVersion('1.2', '1.3', function (t) {
                console.log("Update database from v 1.2 to 1.3.");
                createV1p3(t);
            }, function (e) {console.error(e)});
        }

        function createV1p2(t){
            t.executeSql('CREATE TABLE IF NOT EXISTS history (ID INTEGER PRIMARY KEY ASC, number INTEGER, body TEXT, sent DATETIME, cost INTEGER)',[],null,function(tx, error){console.log(error.message);});
        }

        function createV1p3(t){
            //create temp tables for existing data
            t.executeSql('CREATE TEMPORARY TABLE tmp_contacts (ID INTEGER PRIMARY KEY ASC, gid TEXT NULL, photo TEXT NULL, name TEXT, updated DATETIME)',[],null,function(tx, error){console.log(error.message);});
            t.executeSql('CREATE TEMPORARY TABLE tmp_phones (ID INTEGER PRIMARY KEY ASC, contact_id INTEGER NULL, number INTEGER, updated DATETIME)',[],null,function(tx, error){console.log(error.message);});
            t.executeSql('CREATE TEMPORARY TABLE tmp_history (ID INTEGER PRIMARY KEY ASC, contact_id INTEGER NULL, number_id INTEGER, body TEXT, sent DATETIME, cost INTEGER)',[],null,function(tx, error){console.log(error.message);});
            //insert data to tmp table
            var sql = 'INSERT INTO tmp_contacts (gid,photo,name,updated) SELECT gid,photo,name,created FROM contacts GROUP BY name';
            t.executeSql(sql,[],function(){
                sql = 'INSERT INTO tmp_phones (contact_id,number,updated) SELECT t.ID, e.number, DATETIME() FROM tmp_contacts as t JOIN contacts as e ON t.name=e.name ';
                t.executeSql(sql,[],function(){
                    sql = 'INSERT INTO tmp_history (contact_id,number_id,body,sent,cost) SELECT tp.contact_id,tp.ID,h.body,h.sent,h.cost FROM history as h JOIN tmp_phones as tp ON tp.number=h.number';
                    t.executeSql(sql,[],function(){
                        //delete old table
                        sql = 'DROP TABLE contacts';
                        t.executeSql(sql,[],function(){
                            sql = 'DROP TABLE history';
                            t.executeSql(sql,[],function(){
                                sql = 'CREATE TABLE contacts (ID INTEGER PRIMARY KEY ASC, gid TEXT NULL, photo TEXT NULL, name TEXT, updated DATETIME)';
                                t.executeSql(sql,[],function(){
                                    sql = 'INSERT INTO contacts SELECT * FROM tmp_contacts';
                                    t.executeSql(sql,[],function(){
                                        sql = 'DROP TABLE tmp_contacts';
                                        t.executeSql(sql,[],function(){},function(tx, error){console.error(error.message);});
                                    },function(tx, error){console.error(error.message);});
                                },function(tx, error){console.error(error.message);});

                                sql = 'CREATE TABLE phones (ID INTEGER PRIMARY KEY ASC, contact_id INTEGER NULL, number INTEGER, updated DATETIME)';
                                t.executeSql(sql,[],function(){
                                    sql = 'INSERT INTO phones SELECT * FROM tmp_phones';
                                    t.executeSql(sql,[],function(){
                                        sql = 'DROP TABLE tmp_phones';
                                        t.executeSql(sql,[],function(){},function(tx, error){console.error(error.message);});
                                    },function(tx, error){console.error(error.message);});
                                },function(tx, error){console.error(error.message);});

                                sql = 'CREATE TABLE history (ID INTEGER PRIMARY KEY ASC, contact_id INTEGER NULL, number_id INTEGER, body TEXT, sent DATETIME, cost INTEGER)';
                                t.executeSql(sql,[],function(){
                                    sql = 'INSERT INTO history SELECT * FROM tmp_history';
                                    t.executeSql(sql,[],function(){
                                        sql = 'DROP TABLE tmp_history';
                                        t.executeSql(sql,[],function(){},function(tx, error){console.error(error.message);});
                                        t.executeSql('ALTER TABLE `history` ADD `number` INTEGER NULL',[],null,function(tx, error){console.error(error.message);});
                                        t.executeSql('ALTER TABLE `history` ADD `hash` TEXT NULL',[],null,function(tx, error){console.error(error.message);});
                                    },function(tx, error){console.error(error.message);});
                                },function(tx, error){console.error(error.message);});

                            },function(tx, error){console.error(error.message);});
                        },function(tx, error){console.error(error.message);});
                    },function(tx, error){console.error(error.message);});
                },function(tx, error){console.error(error.message);});
            },function(tx, error){console.error(error.message);});
        }
    },
    /**
     * Często powtarzane zadanie wstawiania nowego kontaktu do DB.
     * Ta funkcja nie sprawdza czy kontakt już istnieje w DB!
     *
     * @param data object: name (required) - nazwa kontaktu,
     *                      number (required) - numer telefonu kontaktu,
     *                      error (optional) - funkcja wywoływana podczas błędu
     *                      callback (optional) - funkcja wywoływana po zapisanu danych. Parametrem funkcji jest obiekt wawierający dane wejściowe (nazwa + numer) oraz ID wstawionego rekordu
     */
    insertContact: function(data){
        var query = "INSERT INTO contacts (name,updated,gid,photo) VALUES (?,datetime('now'),?,?)";
        
        //console.log("insert: ",data);
        if( typeof data.callback != 'function' ){
            data.callback = function(){}
        }
        if( typeof data.error != 'function' ){
            data.error = function(){}
        }
        data.gid = data.gid||null;
        data.photo = data.photo||null;

        var searchField = 'name';
        var searchValue = data.name;
        if( data.gid ){
            searchField = 'gid';
            searchValue = data.gid;
        }

        var searchContactQuery = "SELECT id FROM contacts WHERE " + searchField + " LIKE ?";
        DatabaseHelper.getConnection().transaction(function(tx) {
            tx.executeSql(searchContactQuery,[ searchValue ],function(tx, result){
                var cnt = result.rows.length;
                if( cnt == 0 ){
                    tx.executeSql(query, [data.name,data.gid,data.photo], function(tx, insertResult){
                        var contactId = insertResult.insertId;
                        DatabaseHelper.insertContactNumbers(tx, contactId, data.number, function(res){
                            if(res.no && res.id ){
                                data.callback({
                                    number:res.no,
                                    name:data.name,
                                    id: contactId,
                                    number_id: res.id
                                });
                            } else {
                                data.error( res );
                            }
                        });
                    }, function(tx, error){
                        console.error( 'DatabaseHelper::insertContact', error );
                        data.error(error);
                    });
                } else {
                    var item = result.rows.item(0);
                    var contactId = item.ID
                    DatabaseHelper.insertContactNumbers(tx, contactId, data.number,function(res){
                        if(res.no && res.id ){
                            data.callback({
                                number:res.no,
                                name:data.name,
                                id: contactId,
                                number_id: res.id
                            });
                        } else {
                            data.error( res );
                        }
                    });
                }
            },function(tx, error){
                console.error( 'DatabaseHelper::insertContact', error );
                data.error(error);
            });
        });
    },
    insertContactNumbers: function(tx, contactId, phonesData, callback){
        if( typeof phonesData == 'string' ){
            DatabaseHelper.insertContactNumber(tx, contactId, phonesData, callback);
        } else {
            for( var i = 0; i < phonesData.length; i++ ){
                DatabaseHelper.insertContactNumber(tx, contactId, phonesData[i], callback);
            }
        }
    },
    insertContactNumber: function(tx, contactId, number, callback){

        var query = "SELECT id FROM phones WHERE number=?";
        tx.executeSql(query, [number], function(tx, result){
            if(result.rows.length != 0){
                var item = result.rows.item(0);
                callback({
                    id: item.ID,
                    no: number
                });
            } else {
                var query_number = "INSERT INTO phones (contact_id,number,updated) VALUES (?,?,datetime('now'))";
                tx.executeSql(query_number, [contactId,number], function(tx, result){
                    var number_id = result.insertId;
                    callback({
                        id: number_id,
                        no: number
                    });
                },
                function(tx, error){
                    console.error( 'DatabaseHelper::insertContactNumber', error );
                    callback(error);
                });
            }
        }, function(tx,error){
            console.error( 'DatabaseHelper::insertContactNumber', error );
            callback(error);
        });
    }
}
/**
 * Array Remove - By John Resig
 * Remove array elements
 *
 * If to param is not specified all alements till end will be removed
 *
 * @param from (int) start remove position
 * @param to (int) end remove position
 * @license (MIT Licensed)
 */
Array.prototype.remove = function(from, to) {
  var rest = this.slice((to || from) + 1 || this.length);
  this.length = from < 0 ? this.length + from : from;
  return this.push.apply(this, rest);
};
/**
 * Sprawdza czy tablica ma jeszcze jakieś elementy.
 * @return boolean true jeśli jest jakiś element w tablicy
 */
Array.prototype.hasNext = function(){
    if( this.length == 0 ) return false;
    return true;
}
/**
 * Pobiera pierwszy element z tablicy i usuwa go z niej.
 * Jeśli tablica jest pusta zwraca null
 */
Array.prototype.next = function(){
    if( this.length == 0 ) return null;
    return this.shift();
}
/**
 * Array Remove - By John Resig
 * Remove array elements
 *
 * If to param is not specified all alements till end will be removed
 *
 * @param from (int) start remove position
 * @param to (int) end remove position
 * @license (MIT Licensed)
 */
Array.prototype.remove = function(from, to) {
  var rest = this.slice((to || from) + 1 || this.length);
  this.length = from < 0 ? this.length + from : from;
  return this.push.apply(this, rest);
};

MenuBuilder = {
    items: [{'label':'options','path':'options.html'},{'label':'contacts','path':'contacts.html'},{'label':'history','path':'history.html'},{'label':'help','path':'help.html'},{'label':'www_site','path':'http://bramka-era.blogspot.com/','target':'_blank'}],
    wrapper: 'nav.main-menu',
    build: function(){
        var items = MenuBuilder.sort();
        var wrapper = document.querySelector(MenuBuilder.wrapper);
        wrapper.innerHTML = '';
        while( items.hasNext() ){
            var item = items.next();
            wrapper.appendChild( MenuBuilder.createElement(item) );
        }
    },
    sort:function(){
        var path = location.pathname.substr(1);
        var _it = MenuBuilder.items;
        var sorted = [];
        while( _it.hasNext() ){
            var item = _it.next();
            if( item.path == path ){
                sorted.unshift(item);
            } else {
                sorted[sorted.length] = item;
            }
        }
        return sorted;
    },
    createElement: function(elementData){
        var a = document.createElement('a');
        a.href = elementData.path;
        var label = chrome.i18n.getMessage( elementData.label );
        if( !label || label == '' ){
            label = elementData.label;
        }
        a.innerHTML = label;
        if( elementData.target ){
            a.target = elementData.target;
        }
        return a;
    }
};
if( typeof HTMLElement != 'undefined' ){
/**
 * Dodaje do elementu DOM metodę odnajdującą rodzica 
 * o podanych parametrach (CSS3 selector).
 *
 * Działa tylko w przeglądarkach HTML5!
 *
 * @param selector {String} Selektor CSS3
 * @return {DOMElement} pierwszy napotkany obiekt spełniający kryteria selektora lub null
 * @example <code>element.getParent('a.anchor[href^="http"]')</code>
 */
HTMLElement.prototype.getParent = function(selector){
    var result = null;
    var prev = this;
    var parent = this.parentNode;
    while(true){
        if( parent == null ){
            break;
        }
        var _r = parent.querySelector(selector);
        if( _r == null ){
            prev = parent;
            parent = parent.parentNode;
            continue;
        }
        result = prev;
        break;
    }
    return result;
}
HTMLInputElement.prototype.hasFocus = function(){return this.focused;}
HTMLInputElement.prototype.focused = false;
/**
 * Check if element has a class name
 * changed for HTML5 support
 */
HTMLElement.prototype.hasClass = function(cls){
    if( this.classList ){
        return this.classList.contains(cls);
    }
    return this.className.indexOf(cls) != -1;
}
/**
 * Add class to class list
 * changed for HTML5 support
 */
HTMLElement.prototype.addClass = function(cls){
    if( this.classList ){
        this.classList.add(cls);
    } else {
        if( !this.hasClass(cls) )
            this.className += ' ' + cls;
    }
    
    return this;
}
/**
 * Remove class name from class list
 * changed for HTML5 support
 */
HTMLElement.prototype.removeClass = function(cls){
    if( this.classList ){
        this.classList.remove(cls);
    } else {
        var r = '(\\s)?'+cls+'';
        var re = new RegExp(r);
        re.ignoreCase = true;
        re.global = true;
        this.className = this.className.replace(re, '');
    }
    return this;
}
HTMLElement.prototype.toggleClass = function(cls){
    if( this.classList ){
        this.classList.toggle(cls);
    } else {
        if( this.hasClass(cls) ){
            this.removeClass(cls);
        } else {
            this.addClass(cls);
        }
    }
    return this;
}
HTMLElement.prototype.wrap = function(tag){
    var tagObj = this.parentNode.insertBefore( document.createElement( tag ) , this);
    tagObj.appendChild( this );
    return tagObj;
}
 /**
  * From prototype.js
  * related to: Function#bindAsEventListener
   *  Function#bind(context[, args...]) -> Function
   *  - context (Object): The object to bind to.
   *  - args (?): Optional additional arguments to curry for the function.
   *
   *  Binds this function to the given `context` by wrapping it in another
   *  function and returning the wrapper. Whenever the resulting "bound"
   *  function is called, it will call the original ensuring that `this` is set
   *  to `context`. Also optionally curries arguments for the function.
   *
   *  ##### Examples
   *
   *  A typical use of [[Function#bind]] is to ensure that a callback (event
   *  handler, etc.) that is an object method gets called with the correct
   *  object as its context (`this` value):
   *
   *      var AlertOnClick = Class.create({
   *        initialize: function(msg) {
   *          this.msg = msg;
   *        },
   *        handleClick: function(event) {
   *          event.stop();
   *          alert(this.msg);
   *        }
   *      });
   *      var myalert = new AlertOnClick("Clicked!");
   *      $('foo').observe('click', myalert.handleClick); // <= WRONG
   *      // -> If 'foo' is clicked, the alert will be blank; "this" is wrong
   *      $('bar').observe('click', myalert.handleClick.bind(myalert)); // <= RIGHT
   *      // -> If 'bar' is clicked, the alert will be "Clicked!"
   *
   *  `bind` can also *curry* (burn in) arguments for the function if you
   *  provide them after the `context` argument:
   *
   *      var Averager = Class.create({
   *        initialize: function() {
   *          this.count = 0;
   *          this.total = 0;
   *        },
   *        add: function(addend) {
   *          ++this.count;
   *          this.total += addend;
   *        },
   *        getAverage: function() {
   *          return this.count == 0 ? NaN : this.total / this.count;
   *        }
   *      });
   *      var a = new Averager();
   *      var b = new Averager();
   *      var aAdd5 = a.add.bind(a, 5);   // Bind to a, curry 5
   *      var aAdd10 = a.add.bind(a, 10); // Bind to a, curry 10
   *      var bAdd20 = b.add.bind(b, 20); // Bind to b, curry 20
   *      aAdd5();
   *      aAdd10();
   *      bAdd20();
   *      bAdd20();
   *      alert(a.getAverage());
   *      // -> Alerts "7.5" (average of [5, 10])
   *      alert(b.getAverage());
   *      // -> Alerts "20" (average of [20, 20])
   *
   *  (To curry without binding, see [[Function#curry]].)
  **/
Object.prototype.bind = function(context){
    var slice = Array.prototype.slice;
    var __method = this, args = slice.call(arguments, 1);
    return function() {
      var a = merge(args, arguments);
      return __method.apply(context, a);
    }
}
}
var UI = {};
UI.dialog = function(options){
    UI.createOverlay();
    var opts = {};
    if( options.width ){
        opts.width = options.width;
    }
    if( options.height ){
        opts.height = options.height;
    }
    var wrapper = UI.createDialog(opts);

    var title = document.createElement('div');
    title.className = 'dialog-title';
    if( options.title ){
        title.innerHTML = '<h2>'+options.title+'</h2>';
    }
    wrapper.appendChild(title);
    var o = document.createElement('div');
    o.className='dialog-content';
    if( typeof options.content == 'string' ){
        o.innerHTML = options.content;
    } else if( options.content instanceof HTMLElement ){
        if( options.content.parentNode == null ){
            o.appendChild(options.content);
        } else {
            o.appendChild(options.content.cloneNode(true));
        }
    }
    wrapper.appendChild( o );

    var buttonsBar = document.createElement( 'div' );
    buttonsBar.className = 'dialog-buttons';

    //buttons
    if( options.buttons ){
        var it = options.buttons;
        var i = 0;
        while( it.hasNext() ){
            i++;
            var item = it.next();
            var b = null;
            if(item.type=='button'){
                b = document.createElement( 'button' );
            } else {
                b = document.createElement( 'a' );
                b.href='#';
            }
            b.id = 'dialog-button-'+i;
            b.innerHTML = item.label;
            buttonsBar.appendChild( b );
            b.addEventListener('click', item.action);
        }
    }
    wrapper.appendChild( buttonsBar );
    UI.positioneDialog();
    window.addEventListener('resize', UI.resizeHandler);
}
UI.closeDialog = function(){
    window.removeEventListener('resize', UI.resizeHandler);
    var dialog = document.querySelector('div.dialog-container');
    dialog.parentNode.removeChild( dialog );
    var overlay = document.getElementById('bg-overlay');
    overlay.parentNode.removeChild( overlay );
}
UI.resizeHandler = function(e){
    UI.positioneDialog();
}
UI.positioneDialog = function(){
    var dialog = document.querySelector('div.dialog-container');
    
    var _left = (window.innerWidth - dialog.clientWidth)/2;
    var _top = (window.innerHeight - dialog.clientHeight)/2;
    if( _left < 0 ) _left = 0;
    if( _top < 0 ) _top = 0;
    dialog.style.top = _top+'px';
    dialog.style.left = _left+'px';
}
UI.createOverlay = function(){
    var o = document.createElement('div');
    o.id = 'bg-overlay';
    document.body.appendChild( o );
    return o;
}
UI.createDialog = function(opt){
    var o = document.createElement('div');
    var w = document.createElement('div');
    o.className = 'dialog-container';
    if( opt.width ){
        o.style.width = opt.width+'px';
    }
    if( opt.height ){
        o.style.height = opt.height+'px';
    }
    w.className = 'dialog-wrapper';
    o.appendChild( w );
    document.body.appendChild( o );
    return w;
}
/**
 * @description Boks do wysyłania wiadomości.
 * Boks do wysyłania wiadomości. Można go użyć w dowolnym miejscu.
 * 
 */
var SenderBox = {
    canSend: function(){
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
            return false;
        }
        return true;
    },
    createFromNumber: function(number){
        if( !SenderBox.canSend() ) {
            return;
        }
        var dialogTitle = "Wyślij wiadomość do "+number;
        var numbers = [number];
        var content = SenderBox.getFormContent(numbers);
        SenderBox.createDialog(content,dialogTitle);
    },
    createBox: function(phoneId){
        
        if( SenderBox.canSend() ) {
            var query = "SELECT c.name,p.number FROM contacts as c " +
                "JOIN phones as p ON p.contact_id = c.id " +
                "WHERE c.id = ?"
            DatabaseHelper.getConnection().transaction(function(tx) {
                tx.executeSql(query, [phoneId], function(tx,res){
                    var phonesLength = res.rows.length;
                    var dialogTitle = "Wyślij wiadomość do ";
                    var numbers = [];
                    if( phonesLength > 1 ){
                        for (var i = 0; i < res.rows.length; i++) {
                            var _it = res.rows.item(i);
                            numbers[numbers.length] = _it.number;
                            if( i == 0 )
                                dialogTitle += _it.name;
                        }
                    } else if( phonesLength == 1 ){
                        var oneItem = res.rows.item(0);
                        dialogTitle += oneItem.name + " (" + oneItem.number + ")";
                        numbers[numbers.length] = oneItem.number;
                    } else {
                        dialogTitle += 'nieznany';
                    }
                    var content = SenderBox.getFormContent(numbers);
                    SenderBox.createDialog(content,dialogTitle);
                });
            });
        }
    },
    createDialog: function(content,dialogTitle){
        UI.dialog( {
            width: 400,
            height: 400,
            content: content,
            title: dialogTitle,
            buttons: [
                {label:'Wyślij wiadomość',action:function(e){return SenderBox.messageHandler();},type:'button'},
                {label:'Anuluj',action:function(){UI.closeDialog();},type:'link'}
            ]
        } );
        var body = document.querySelector('div.dialog-content form.send-text-form textarea#sms-body');
        body.addEventListener( 'keyup' , SenderBox.inputBodyHandler);
        body.focus();
    },
    getFormContent: function(numbers){
        var form = document.createElement('form');
        form.className = 'send-text-form';
        form.action = "#";
        form.addEventListener('submit', function(e){e.preventDefault();return false;} );
        var p = document.createElement('p');
        var body = document.createElement('textarea');
        body.id = "sms-body";
        body.cols = 35;
        body.rows = 6;
        var info = document.createElement('span');
        info.className = 'body-info';
        var infoInner = '<span class="char_cnt">0</span> znaków wpisanych,'+
            'pozostało <span class="char_left">1600</span> znaków.<br/>' +
            'Ilość wysłanych wiadomości: <span class="sms_cnt">0</span><br/>' +
            'Szcowany koszt: <span class="cost_txt">0</span>';
        info.innerHTML = infoInner;

        var input = document.createElement('input');
        input.type = 'hidden';
        input.className = 'sendToNumber';

        if( numbers.length > 1 ){
            var select = document.createElement('select');
            var span = document.createElement('span');
            span.innerHTML = 'wybierz numer: ';
            for (var i = 0; i < numbers.length; i++) {
                var option = document.createElement('option');
                option.value = option.innerHTML = numbers[i];
                select.appendChild( option );
                if( input.value == "" )
                    input.value = numbers[i];
            }
            p.appendChild(span);
            p.appendChild(select);
            select.addEventListener('change', function(){
                var no = this.options[this.selectedIndex].value;
                input.value = no;
            });
        } else {
            input.value = numbers[0];
        }
        p.appendChild(body);
        p.appendChild(info);
        form.appendChild(p);
        form.appendChild(input);
        return form;
    },
    messageHandler: function(){
        var button = document.querySelector('div.dialog-buttons button:first-child');
        button.addClass('buttonSending');
        button.setAttribute( 'disabled' , true);
        button.innerHTML = 'wysyłanie....';

        var body = document.querySelector('div.dialog-content form.send-text-form textarea').value;
        var number = document.querySelector('div.dialog-content form.send-text-form input.sendToNumber').value;
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
            console.error(e);
        }
    },
    inputBodyHandler: function(e){
        var noExecKeys = [8,13,16,17,18,20,33,34,35,36,37,38,39,40,255];
        if( noExecKeys.indexOf(e.keyCode) != -1 ){
            return true;
        }
        
        var str = StringFormatter.formatMessageLocale( this.value );
        
        document.querySelector("div.dialog-content form.send-text-form span.char_cnt").innerHTML = str.length;
        var Gate = chrome.extension.getBackgroundPage().GateProperties;
        var max = Gate.maxSigns[Gate.defaultType];
        if(max != -1){
            if(str.length > max){
                str = str.substr(0,max);
            }
            document.querySelector("div.dialog-content form.send-text-form span.char_left").innerHTML = (max-str.length);
        }
        var signs_per_one = Gate.signs[Gate.defaultType];
        var one_cost = Gate.cost[Gate.defaultType];
        var _x = Math.floor(str.length/signs_per_one);
        if( str.length%signs_per_one != 0 ){
            _x++;
        }
        document.querySelector("div.dialog-content form.send-text-form span.sms_cnt").innerHTML = _x;
        document.querySelector("div.dialog-content form.send-text-form span.cost_txt").innerHTML = (_x*one_cost)+" \u017cetonów";
        this.value = str;
        return true;
    }
}
function getUTCtimeStamp(){
    return (new Date()).getTime()-Date.UTC(1970,0,1);
}