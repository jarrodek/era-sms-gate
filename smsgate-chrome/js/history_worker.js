importScripts('helper.js');

var HistoryWorker = {
    parseHistory: function(data){
        var db = DatabaseHelper.getConnection();
        db.transaction(function(tx) {
            var hashes = "'"+data.join("','")+"'";
            var query = "SELECT hash FROM history WHERE hash IN ("+hashes+")";
//            postMessage({payload:'log',data:query});
            var hashCopy = data;
            tx.executeSql(query, [],function(tx, result){
                var max = result.rows.length;
                if( max > 0 ){
                    for (var i = 0; i < max; i++) {
                        var item = result.rows.item(i);
                        var gotHash = item.hash;
                        var index = hashCopy.indexOf( gotHash );
                        if( index == -1 ) continue;

                        var to = ( (index + 1) == hashCopy.length ) ? null : (index + 1);
                        hashCopy.remove(index, to);
                    }
                }
                postMessage({payload:'getItems',data:hashCopy});
            },function(tx, error){
                
                throw new Error( error.message );
            });
        });
    },
    saveHistory: function(data){
        var cnt = data.length;
        for (var i = 0; i < cnt; i++) {
            HistoryWorker.saveItem( data[i] )
        }
    },
    saveItem : function(data){
        //{cost:18,hash:"testHash",body:"aaaaa - test",recipient:"48600449707",time:1295279410993}
        var cost = data.cost || 0;
        var hash = data.hash;
        var query = "SELECT contact_id, ID FROM phones WHERE number=? LIMIT 1";
        var body = data.body;
        var recipient = data.recipient;
        var time = data.time||null;
        var dateStr = null;
        var db = DatabaseHelper.getConnection();
        db.transaction(function(tx) {
            tx.executeSql(query, [recipient],
                function(tx, result){
                    var queryParams = []
                    var query = "INSERT INTO history (contact_id,number_id,body,sent,cost,number,hash) VALUES ";

                    var timeStr = "";
                    var date = new Date();
                    if( time ){
                        date.setTime( time );
                    }
                    var month = date.getMonth();
                    month++;
                    if( month < 10 ){
                        month = "0"+month;
                    }
                    var hr = date.getHours();
                    if(hr < 10){
                        hr = "0" + hr;
                    }
                    var min = date.getMinutes();
                    if(min < 10){
                        min = "0" + min;
                    }
                    var sec = date.getSeconds();
                    if(sec < 10){
                        sec = "0" + sec;
                    }
                    dateStr = date.getFullYear() + "-" + month + "-" + date.getDate() + " " + hr + ":" + min + ":" + sec;
                    timeStr = "'"+dateStr+"'";
//                    postMessage({payload:'log',data:[timeStr,date,time]});
                    var number_id = null;
                    var contact_id = null;
                    if( result.rows.length > 0 ){
                        var item = result.rows.item(0);
                        contact_id = item.contact_id;
                        number_id = item.ID;
                        query += " (?,?,?,"+timeStr+",?,null,?)";
                        queryParams = [contact_id, number_id, body, cost,hash];
                    } else {
                        query += " (null,null,?,"+timeStr+",?,?,?)";
                        queryParams = [body,cost,recipient,hash];
                    }
                    tx.executeSql(query,queryParams,function(tx,res){
                        var eventData = {};
                        eventData.cost = cost;
                        eventData.hash = hash;
                        eventData.body = body;
                        eventData.recipient = recipient;
                        eventData.number_id = number_id;
                        eventData.contact_id = contact_id;
                        if( time ){
                        eventData.time = time;
                        } else {
                        eventData.time = date.getTime();
                        }
                        eventData.date = dateStr;
                        eventData.id = res.insertId;

                        postMessage({payload:'saved',event:eventData});

                    },function(tx,err){
                        throw new Error( err.message );
                    });
                },
                function(tx, error){
                    throw new Error( error.message );
                }
            );
        });
    }
};
onmessage = function (event) {
    var data = event.data;

    if( data.payload == "parse" ){
        HistoryWorker.parseHistory(data.data);
    } else if( data.payload == "save" ){
        HistoryWorker.saveHistory(data.data);
    } else if( data.payload == "saveitem" ){
        HistoryWorker.saveItem(data.data);
    }
}