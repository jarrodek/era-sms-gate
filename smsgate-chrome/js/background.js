var oauth = null;
var oauthParams = {
    'request_url' : 'https://www.google.com/accounts/OAuthGetRequestToken',
    'authorize_url' : 'https://www.google.com/accounts/OAuthAuthorizeToken',
    'access_url' : 'https://www.google.com/accounts/OAuthGetAccessToken',
    'consumer_key' : 'anonymous',
    'consumer_secret' : 'anonymous',
    'scope' : 'http://www.google.com/m8/feeds/', //https://www-opensocial.googleusercontent.com/api/people/ << @me
    'app_name' : 'Bramka SMS Era Chrome Extension'
};

function logoutGmail(){
    oauth.clearTokens();
    eraApp.setPageIconAction( 'app-connected' );
}
/**
 * Backgrund application constructor.
 */
function App(){
    this.loggedIn = false;
}
/**
 * Init background app
 */
App.prototype.init = function(){
    
    function connectionChangeHandler(e){
        var state = e.data;
        var allowedStates = ['login-required','app-connected','gmail-connected','not-connected'];
        if( allowedStates.indexOf( state ) == -1 ){
            throw new Error( "State " + state + " is not allowed state type!" );
        }
        this.setPageIconAction(state);
        if( state == 'login-required' ){
            this.loggedIn = false;
        } else if( state == 'app-connected' ){
            this.loggedIn = true;
            AppEvents.fire('app.conected', null);
        } else if( state == 'not-connected' ){
            this.loggedIn = false;
            AppEvents.fire('app.disconected', null);
        }
    }
    if( !localStorage.firstRunV2p0 ){
        localStorage.firstRunV2p0 = true;
        chrome.tabs.create({
            url:'firstrun.html'
        });
        if( this.loggedIn ){
            this.setUpAppFirstConfig();
        } else {
            AppEvents.observe('app.connect.change', function(e){
                if( localStorage.initialAppConfig ) return;
                var state = e.data;
                if( state == 'app-connected' ){
                    this.setUpAppFirstConfig();
                }
            }.bind(this));
        }
    }

    var context = this;
    AppEvents.observe('app.connect.change', function(e){
        connectionChangeHandler.apply(context,[e])
    });

    if( this.loggedIn == false ){
        this.requireLogin();
    }
    
    this.loadObservers();
}
//only on first run 2.0 version: init config on server
App.prototype.setUpAppFirstConfig = function(){

    var browserID = localStorage['browserID'];
    if (browserID == undefined) {
        browserID = (Math.random() + '').substring(3);
        localStorage['browserID'] = browserID;
    }

    var eraGateType = localStorage['eraGateType'];
    if (eraGateType == undefined) {
        eraGateType = "multimedia"; //or sponsored
        localStorage['eraGateType'] = eraGateType;
    }

    if( !localStorage.gatePassword || localStorage.gatePassword == "" || !localStorage.gateLogin || localStorage.gateLogin == "" ){
        return;//no config vars at all. should receive one from srv or create one manually
    }
    
    this.initialConfigUploadStarted = true;
    var addr = VARS.optionsUrl;
    var xhr = new XMLHttpRequest();
    xhr.open("POST", addr, true);
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    xhr.setRequestHeader('X-Same-Domain', 'true');
    var updateStr = "";
    updateStr += "pwd="+encodeURI(localStorage.gatePassword);
    updateStr += "&log="+encodeURI(localStorage.gateLogin);
    updateStr += "&hisory=true";
    updateStr += "&gmail="+localStorage.synchGmail;
    updateStr += "&gateType="+eraGateType;
    localStorage.synchAppSettings = true;
    localStorage.historyEnabled = true;
    var context = this;
    xhr.onreadystatechange = function() {
        if ( (this.readyState == 4) && (this.status == 200) ) {
            var data = JSON.parse(xhr.responseText);
            if( !data.error ){
                localStorage.configUpdate = ( new Date().getTime() / 1000 );
                localStorage.gatePassword = null;
                context.initialConfigUploadStarted = false;
                context.synchHistory();
            }
        }
    }
    xhr.send(updateStr);
}
App.prototype.loadObservers = function(){
    var context = this;
    AppEvents.observe('app.disconected', function(e){
        window.setTimeout( function(){
            return context.requireLogin.call(context);
        } , 10000);
    });
    AppEvents.observe('app.conected', function(e){
        //uruchomienie synchronizacji ustawień i historii
        context.synchSettings();
    });
}

/**
 * Check if User is logged In.
 * Possible actions is not logged in, logged in or unknown (connection error).
 * In fesult it's fireing event.
 */
App.prototype.requireLogin = function(){
    this.setPageIconAction('not-connected');
    this.sendToApp(VARS.loginStatusUrl, null, function(status){
        try{
        if( status == STATUS.LOGIN_REQUIRED ){
            AppEvents.fire('app.connect.change', 'login-required' );
        } else if( status && status != 0 && status.substr(0,2) == STATUS.SUCCESS ){
            var userEmail = status.substr(3);
            if( userEmail.length != 0 ){
                sessionStorage['userEmail'] = userEmail;
            }
            AppEvents.fire('app.connect.change', 'app-connected' );
        } else {
            AppEvents.fire('app.connect.change', 'not-connected' );
        }
        }catch(e){AppEvents.fire('app.connect.change', 'not-connected' );}
    },'GET');
}
App.prototype.setPageIconAction = function(status){
    switch(status){
        case 'not-connected':
            chrome.browserAction.setIcon({
                'path' : 'images/ic_32_error.png'
            });
            chrome.browserAction.setPopup({
                'popup':'not-connected.html'
            });
            break;
        case 'app-connected':
            chrome.browserAction.setIcon({
                'path' : 'images/icon_32.png'
            });
            chrome.browserAction.setPopup({
                'popup':'popup.html'
            });
            break;
        case 'gmail-connected':
            chrome.browserAction.setIcon({
                'path' : 'images/icon_32.png'
            });
            chrome.browserAction.setPopup({
                'popup':'popup.html'
            });
            break;
        case 'login-required':
            chrome.browserAction.setIcon({
                'path' : 'images/ic_32_error.png'
            });
            chrome.browserAction.setPopup({
                'popup':'popup_login.html'
            });
            break;
    }
}
App.prototype.sendToApp = function(sendUrl,sendData,listener,method){
    method = method || 'POST';
    VARS.req.open(method, sendUrl, true);
    VARS.req.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    VARS.req.setRequestHeader('X-Same-Domain', 'true');  // XSRF protector
    
    VARS.req.onreadystatechange = function() {
        if (this.readyState == 4) {
            if (VARS.req.status == 200) {
                var body = VARS.req.responseText;
                if (body.indexOf('OK') == 0) {
                    listener(body);
                } else if (body.indexOf('LOGIN_REQUIRED') == 0) {
                    listener(STATUS.LOGIN_REQUIRED);
                } else {
                    listener(body);
                }
            } else {
                listener(VARS.req.status, VARS.req.responseText);
            }
        }
    }
    var data = sendData;
    VARS.req.send(data);
}

App.prototype.initGSynch = function(force){

    if( !oauth ){
        oauthParams['callback_page'] = "chrome_ex_oauth.html#initContacts";
        oauth = ChromeExOAuth.initBackgroundPage(oauthParams);
    }
    force = force || false;
    var status = checkSynchStatus();
    if( !force && (status == -1 || status == 0) ) return;

    if( force && (!localStorage.synchGmail || localStorage.synchGmail == "false" ) ){
        localStorage.synchGmail = true;
        var addr = VARS.optionsUrl;
        var xhr = new XMLHttpRequest();
        xhr.open("POST", addr, true);
        xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
        xhr.setRequestHeader('X-Same-Domain', 'true');
        var updateStr = "gmail="+localStorage.synchGmail;
        xhr.send(updateStr);
    }

    if( VARS.gsync == null ){
        VARS.gsync = new Gsync();
    }
    
    VARS.gsync.init();
}
App.prototype.isConnected = function(){
    return this.loggedIn;
}
/**
 * Sprawdza czy jest tutaj konfiguracja
 * i czy jest dostępna aktualizacja konfiguracji.
 */
App.prototype.synchSettings = function(){
    if( this.initialConfigUploadStarted ) return;
    var lastUpdate = localStorage.configUpdate || 0;
    var context = this;
    var URL = VARS.updateOptionsUrl + "t="+lastUpdate;
    this.sendToApp(URL, null , function(data){

        if( data == STATUS.LOGIN_REQUIRED ){
            return;
        } else if(data.substr(0, 2) == STATUS.SUCCESS){

            if( localStorage.synchGmail == "true" ){
                oauth = ChromeExOAuth.initBackgroundPage(oauthParams);
            }

            context.synchHistory();
            return;
        }
        var resp = JSON.parse(data);

        if( resp.error ){ //user do not have any saved configurations
            return;
        }

        if( resp.login ){
            localStorage.gateLogin = resp.login;
        }
        if( resp.historyEnabled ){
            localStorage.historyEnabled = (resp.historyEnabled == "true" );
        }
        if( resp.gateInnerType ){
            localStorage['eraGateType'] = resp.gateInnerType;
        }
        if( resp.synchGmail ){
            var status = (resp.synchGmail == "true" );
            localStorage.synchGmail = status;
            if( status && oauth && !oauth.hasToken() ){
                chrome.tabs.create({
                    url:'enable_gmail_contacts.html'
                });
            } else if( status && !oauth ){
                oauthParams['callback_page'] = "chrome_ex_oauth.html#initContacts";
                oauth = ChromeExOAuth.initBackgroundPage(oauthParams);
            }
        }
        localStorage.configUpdate = ( new Date().getTime() / 1000 );
        context.synchHistory();
    }, "GET");
}
App.prototype.synchHistory = function(){
    History.synchHistory();
}

function checkSynchStatus(){
    if(typeof localStorage.synchGmail == 'undefined'){
        console.log("set gsynch to true");
        localStorage.synchGmail = true;
        localStorage.synchGmailTime = -1;
    }
    if( !localStorage.synchGmail == "false" ) return 0;
    if (oauth && oauth.hasToken()) {
        var lastSynch = localStorage.synchGmailTime;
        if( typeof lastSynch == 'undefined' ) return 1;
        var current = new Date().getTime();
        if( (current - lastSynch) > VARS.GMAIL_REFRESH_TIME ) return 1;
        return 0;
    }
    return -1;
}

var eraApp = new App();


/**
 * Global app events.
 * Najprostrze użycie:
 * jakiś moduł rozszerzenie tworzy w background obserwatora eventa
 * (np contactAddedEvent). W innym miejscu aplikacji
 * jest wywoływany ten event (dodano nowy kontakt).
 * Jako że jest to robione w background to wszystkie zainteresowane
 * moduły otrzymają event.
 *
 * Event tworzony w ten sposób przenosi informacje w włąściwości eventu data:
 * <code>function(e){ var passedDataObjectOrArrayOrStringOr... = e.data; }</code>
 *
 */
var AppEvents = {
    observe : function(name,observer){
        document.body.addEventListener(name, observer, true);
    },
    fire: function(name,params){
        var evt = document.createEvent("HTMLEvents");
        evt.initEvent(name, true, true ); // event type,bubbling,cancelable
        evt.data = params || null;
        document.body.dispatchEvent(evt);
    },
    unobserve: function(name, observer){
        document.body.removeEventListener(name,observer,true);
    }
}
//TODO in future :]
var AppConnector = {
    channel: null,
    initChannel: function(){
        var xhr = new XMLHttpRequest();
        xhr.open('POST', VARS.channelConectionUrl, true);
        xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
        xhr.setRequestHeader('X-Same-Domain', 'true');  // XSRF protector
        var chromeRegistrationId = localStorage['chromeRegistrationId'];
        if (chromeRegistrationId == undefined) {
            chromeRegistrationId = StringFormatter.uuid();
            localStorage['chromeRegistrationId'] = chromeRegistrationId;
        }
        xhr.onreadystatechange = function() {
            if (this.readyState == 4) {
                if (xhr.status == 200) {
                    var data = JSON.parse( xhr.responseText );
                    if( !data.id ) return;
                    AppConnector.channel = data.id;
                    var channel = new goog.appengine.Channel(AppConnector.channel);
                    var socket = channel.open();
                    socket.onopen = function() {
                        console.log('Browser channel initialized');
                    }
                    socket.onclose = function() {
                        console.log('Browser channel closed');
                        setTimeout('AppConnector.initChannel()', 0);
                    }
                    socket.onerror = function(error) {
                        console.log(error);
                        if (error.code == 401) {  // token expiry
                            console.warn('Browser channel token expired - reconnecting');
                        } else {
                            console.warn('Browser channel error');
                        // Automatically reconnects
                        }
                    }
                    socket.onmessage = function(evt) {
                        console.log('socket msg: ',evt)
                    }
                }
            }
        }
        var data = 'chromeregid=' + chromeRegistrationId ;
        xhr.send(data);
    },
    posMessage: function(path,params){
        var startSign = "&";
        if( path.indexOf("?") == -1 ){
            startSign = "?";
        }

        path += startSign + 'k=' + AppConnector.channel;
        if (params) {
            path += '&' + params;
        }

        var xhr = new XMLHttpRequest();
        xhr.open('POST', path, true);
        xhr.send();
    }
}
var GateProperties = {
    cost : {
        sms:18,
        mms:36
    },
    signs : {
        sms:160,
        mms:-1
    },
    maxSigns : {
        sms:1600,
        mms:-1
    },
    defaultType: 'sms'
}