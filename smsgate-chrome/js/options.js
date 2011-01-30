function loadOptions(){
    MenuBuilder.build();

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

    var lastSynchDate = "";

    if( localStorage.historyEnabled == "false" ){
        lastSynchDate = "Synchronizacja jest wyłączona";
    } else {
        if( !localStorage.historyEnabled ){
            localStorage.historyEnabled = true;
        }

        if( !localStorage.historyAppUpdate || localStorage.historyAppUpdate == 0 ){
            lastSynchDate = "jeszcze nie synchronizowano";
        } else {
            lastSynchDate = TimeFormatter.parseLongDate( localStorage.historyAppUpdate, true );
        }
    }
    document.getElementById("last-synch").innerHTML = lastSynchDate;
    var title = chrome.i18n.getMessage("options_page_title");
    document.title = title;

    if(localStorage.gateLogin){
        document.getElementById("login").value = localStorage.gateLogin;
    }
    document.getElementById("passwd").value = '';
    
    //włączona synchronizacja kontaktów gmail
    if(localStorage.synchGmail=="true"){
        document.getElementById("synch-gmail").checked = true;
    } else {
        document.getElementById("synch-gmail").checked = false;
    }
    //domyślnie włączone
    if(localStorage.historyEnabled == "false"){
        document.getElementById('save-history').checked = false;
    } else {
        document.getElementById('save-history').checked = true;
    }

    if( typeof localStorage.synchAppSettings == "undefined" ){
        localStorage.synchAppSettings = true;
    }

    if( localStorage.synchAppSettings == "false" ){
        document.getElementById( "turn-off-synch" ).checked = true;
    } else {
        document.getElementById( "turn-off-synch" ).checked = false;
    }

    document.getElementById("synch-gmail").addEventListener('change', function(){
        localStorage.synchGmail = this.checked;
    });
    document.getElementById("save-history").addEventListener('change', function(){
        localStorage.historyEnabled = this.checked;
    });
    document.getElementById( "turn-off-synch" ).addEventListener('change', function(){
        localStorage.synchAppSettings = !this.checked;
    });

    var oauth = chrome.extension.getBackgroundPage().oauth;
    if(oauth.hasToken()){
        document.getElementById("sync-gmail-field").style.display = 'block';
        document.getElementById("sync-gmail-field-info").style.display = 'none';
    } else {
        document.getElementById("sync-gmail-field").style.display = 'none';
        document.getElementById("sync-gmail-field-info").style.display = 'block';
    }
    if( eraGateType == "sponsored" ){
        document.getElementById("gateInnerType").selectedIndex = 1;
    }

}
function showPass(state){
    if(state){
        document.getElementById("passwd").type = 'text';
    } else {
        document.getElementById("passwd").type = 'password';
    }
}
function validateNumber(number){
    if( number == '' ) return false;
    number = number.replace(/[\s|\+|-]/gi,"");
    if( isNaN( number ) ) return false;
    var l = number.toString().length;
    if( !(l == 9 || l == 11 )) return false;
    return true;
}
function saveSettings(){
    var login = document.getElementById("login").value;
    if(!validateNumber(login)){
        alert("Wprowad\u017a prawidłowy login bramki ERA.\nNp: 48 602 602 602");
        return;
    }
    var password = document.getElementById("passwd").value;
    var updateStr = "a=b";
    if( password != "" ){
        updateStr += "&pwd="+password;
    }
    localStorage.gateLogin = login;
    updateStr += "&log="+encodeURI(login);
    var gateInnerTypeField = document.getElementById("gateInnerType");
    var gateInnerType = gateInnerTypeField.options[gateInnerTypeField.selectedIndex].value;
    if( gateInnerType == "multimedia" || gateInnerType == "sponsored" ){
        updateStr += "&gateType="+gateInnerType;
    }
    
    if( localStorage.synchAppSettings ){
        updateStr += "&hisory="+localStorage.historyEnabled;
        updateStr += "&gmail="+localStorage.synchGmail;
    }
    
    var bg = chrome.extension.getBackgroundPage();
    if( !bg.eraApp.loggedIn ){
        var log = document.getElementById("log");
        log.innerHTML = 'Zaloguj si\u0119 w aplikacji! (kliknij w ikonę rozszerzenia).';
        log.style.display = 'block'
        return;
    }

    document.getElementById('loader').style.display = 'block';
    var addr = VARS.optionsUrl;
    var xhr = new XMLHttpRequest();
    xhr.open("POST", addr, true);
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    xhr.setRequestHeader('X-Same-Domain', 'true');  // XSRF protector
    xhr.onreadystatechange = function() {
        if (this.readyState == 4) {
            var log = document.getElementById("log");
            if (xhr.status == 200) {
                var data = JSON.parse(xhr.responseText);
                if( data.error ){
                    var localeMessage = chrome.i18n.getMessage("error_"+data.error.code);
                    var message = chrome.i18n.getMessage("error", [localeMessage]);
                    log.innerHTML = message;
                    log.style.display = 'block'
                    return;
                } else {
                    localStorage.configUpdate = getUTCtimeStamp();
                    log.innerHTML = 'Zmiany zostały zapisane';
                    log.style.display = 'block'
                }
            } else {
                //callbacks.error(xhr);
                console.log(xhr.responseText,xhr);
                log.innerHTML = 'Wystąpił błąd połączenia z serwerem aplikacji...';
                log.style.display = 'block'
                return;
            }
            document.getElementById('loader').style.display = 'none';
        }
    }
    xhr.send(updateStr);
//    var log = document.getElementById("log");
//    log.innerHTML = 'Zmiany zosta\u0142y zapisane';
//    log.style.display = 'block';
}