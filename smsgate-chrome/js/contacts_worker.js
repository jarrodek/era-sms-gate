importScripts('helper.js');
/**
 * Sortowanie kontaktów i łączenie numerów tej samej osoby w jeden kontakt.
 * Dane wejściowe:
 * [{ID,photo,number,name,pid}]
 * Dane wyjściowe
 * [{id:ID,name:'name',photo:'photo',phone:[{id:'PID',number:''NO},(n...)]}]
 */
function SortContacts(){
    this.contacts = [];
    this.started = false;
}
/**
 * Dodanie nowego elementu do listy kontaktów.
 * Jeśli rozpoczęło się sortowanie to wówczas dodanie nowego elementu
 * spowoduje błąd.
 * @param item {Object} Obiekt z bazy danych postaci:
 *  {ID,photo,number,name}
 */
SortContacts.prototype.append = function(item){
    if( this.started ){
        throw new Error("Can't add new item after sort begin.");
    }
    this.contacts[this.contacts.length] = item;
}
/**
 * Uruchamia sortowanie.
 * Od tego momenu nie można dodawać nowych elementów do listy
 * (iteracja odbywa się na kopii obiektu i dodanie nowego elemenu nic nie zmieni)
 * Na końcu funkcji wywoływane jest postMessage do wywołującego skryptu.
 */
SortContacts.prototype.run = function(){
    this.started = true;
    var contacts = this.contacts;

    var result = [];
    while( contacts.hasNext() ){
        var item = contacts.next();

        var current_len = result.length;
        var cont = false;
        for( var i=0; i<current_len; i++ ){
            if( result[i].name == item.name ){
                result[i].phone[result[i].phone.length] = {
                    id: item.pid,
                    number: item.number
                }
                cont = true;
                break;
            }
        }

        if( cont ){
            continue;
        }

        result[result.length] = {
            id: item.ID,
            name: item.name,
            photo: item.photo,
            phone: [{id: item.pid,number: item.number}]
        }

    }
    postMessage(result);
}
var sort = new SortContacts();

onmessage = function(event) {
    var data = event.data;
    if( typeof data == 'string' && data == 'start' ){
        sort.run();
    } else {
        sort.append(data);
    }
};