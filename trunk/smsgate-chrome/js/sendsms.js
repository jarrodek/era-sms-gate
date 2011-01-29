/**
 * Wysyłka sms-a przez bramkę ERA
 */
function SendSms(){
    /**
     * Treść wiadomości do wysłania.
     * @param string
     */
    this.body = '';
    /**
     * Numer odbiorcy
     * @param number
     */
    this.recipient = 0;
    /**
     * Czas wysłania wiadomości
     * @param date
     */
    this.sendTime = null;
    /**
     * Koszt wysłania SMS-a
     */
    this.cost = 0;
    /**
     * Zapisanie treści wysyłanej wiadomości w wysłanych.
     * @param boolean
     */
    this.saveToHistory = true;
}

/**
 * Ustawienie wysyłki.
 */
SendSms.prototype.set = function(settings){
    settings = settings||{};
    this.body = settings.body||'';
    this.recipient = settings.recipient||'';
    this.saveToHistory = localStorage.historyEnabled||true;
}
/**
 * Wysłanie wiadomości.
 * Uwaga. Wcześniej należy wywołać metodę set
 * z odpowiednimi parametrami.
 *
 */
SendSms.prototype.go = function(success, error){
    if( !this.recipient || !this.body ){
        error(100,'Brak zdefiniowanego odbiorcy lub tre\u015bci wiadomo\u015bci.');
        return;
    }
//    var body = escape(this.body);
//    var params = {
//        body: body,
//        recipient: this.recipient
//    };
    var context = this;
    var xhr = new XMLHttpRequest();
    xhr.open("POST", VARS.sendUrl, true);
    xhr.onreadystatechange = function() {
        if (xhr.readyState == 4) {
            if (xhr.status == 200) {
                var data = JSON.parse(xhr.responseText);
                if( data.error ){
                    var localeMessage = chrome.i18n.getMessage("error_"+data.error.code);
                    var message = chrome.i18n.getMessage("error", [localeMessage]);
                    error(message);
                    return;
                }

                if( context.saveToHistory ){
                    //SAVE HISTORY
                }
                success(data);
            } else {
                error(xhr);
            }
        }
    }
    var params = 'body=' + encodeURIComponent(this.body) + '&recipient=' + encodeURIComponent( this.recipient );
    xhr.send(params);
}