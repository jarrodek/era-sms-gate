//var baseUrl = 'http://jarrod.local.com';
var baseUrl = 'https://era-sms.appspot.com';
var extensionType = "era_PL";

var _signInUrl = null;
var _signOutUrl = null;
if( typeof chrome != 'undefined' ){
    _signInUrl = baseUrl + '/signin?extret=' + encodeURIComponent(chrome.extension.getURL('help.html')) + '%23signed_in&ver=' + extensionType;
    _signOutUrl = baseUrl + '/signout?extret=' + encodeURIComponent(chrome.extension.getURL('signed_out.html')) + '&ver=' + extensionType;
}

var VARS = {
    loginStatusUrl : baseUrl + '/status',
    signInUrl : _signInUrl,
    signOutUrl : _signOutUrl,
    registerUrl :  baseUrl + '/register?ver=' + extensionType,
    sendUrl : baseUrl + '/send?ver=' + extensionType,
    checkBalanceUrl : baseUrl + '/send?payload=balance&ver=' + extensionType,
    optionsUrl : baseUrl + '/options?ver=' + extensionType,
    historyUrl : baseUrl + '/history?ver=' + extensionType,
    updateOptionsUrl : baseUrl + '/options?payload=update&ver=' + extensionType,
    channelConectionUrl: baseUrl + '/channel?ver=' + extensionType ,
    req : new XMLHttpRequest(),
    sender: null,
    gsync: null,
    GMAIL_REFRESH_TIME: 864001000, //in miliseconds
    contextNum: null,
    contextSelection: null
}
var STATUS = {
    SUCCESS : 'OK',
    LOGIN_REQUIRED : 'login_required'
}
//if( typeof goog != "undefined" )
//    goog.appengine.Socket.BASE_URL = VARS.channelConectionUrl;