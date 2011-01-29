// this whole script won't have access to the dom either
importScripts('helper.js');

onmessage = function(event) {
    var data = JSON.parse(event.data);
    var contacts = [];

    if( !( data && data.feed && data.feed.entry ) ) postMessage([]);

    var cnt = data.feed.entry.length;
    for (var i = 0, entry; i<cnt ; i++) {
        entry = data.feed.entry[i];

        var contact = {
            'name' : entry['title']['$t'],
            'id' : entry['id']['$t'],
            'phone' : [],
            'photo': null,
            'photo_etag': null
        };
        
        if( typeof entry['gd$phoneNumber'] != 'undefined' && typeof entry['gd$phoneNumber'].length == 'number' ){
            var phone_cnt = entry['gd$phoneNumber'].length;
            for(var p=0, phone; p < phone_cnt; p++){
                phone = entry['gd$phoneNumber'][p]['$t'];
                if(NumberFormatter.checkFormat(phone)){
                    phone = NumberFormatter.formatNumber(phone);
                    if(phone.toString().length == 11){
                        contact['phone'].push(phone);
                    }
                }
            }
        } else {
            continue;
        }
        if (!contact['name']) {
            continue;
        }
        if( contact['phone'].length == 0 ){
            continue;
        }
        //photo
        var links_lenght = entry.link.length;
        for( var l = 0; l < links_lenght; l++ ){
            var link = entry.link[l];
            if( link.type == "image/*" && link.rel.indexOf('#photo') != -1 ){
                contact.photo = link.href;
            }
        }
        contacts.push(contact);
    }
    postMessage(contacts);
}