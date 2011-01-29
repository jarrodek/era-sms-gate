var History = {
    synchHistory: function(cursor){
        if( !localStorage.historyEnabled  || localStorage.historyEnabled == "false" ){
            return;
        }
        var bg = chrome.extension.getBackgroundPage();
        var app = bg.eraApp;
        cursor = cursor||false;
        var lastUpdate = localStorage.historyAppUpdate || 0;

        var params = "&t=" + lastUpdate;
        if( cursor ){
            params += '&c=' + encodeURI(cursor);
        }

        app.sendToApp(VARS.historyUrl+params, null, function(data){
            data = JSON.parse(data);
            if( data.cursor && data.data ){
                var _cursor = data.cursor;
                var history = data.data;
                if(history && history.length > 0){
                    var worker = new Worker('js/history_worker.js');
                    worker.onmessage = function (event) {
                        var data = event.data;
                        if( data.payload == 'getItems' ){
                            History.getHistoryItems(data.data);
                        } else if( data.payload == "log" ){
                            console.log( "debug: ", data.data  )
                        }
                    }
                    worker.onerror = function (event) {
                        console.error( "From history worker error (synchHistory): ", event )
                    }
                    worker.postMessage({payload:'parse',data:history});
                    History.synchHistory(_cursor); //check more results
                }
            } else if( data.error.code == 200 ){
                //no more posts
                cursor = null;
                localStorage.historyAppUpdate = new Date().getTime();
            }
        },'GET');
    },
    
    getHistoryItems: function(hashArray){
        var bg = chrome.extension.getBackgroundPage();
        var app = bg.eraApp;
        var max = hashArray.length;
        var params = "";
        for (var i = 0; i < max; i++) {
            params += "&h[]="+hashArray[i];
        }
        params = params.substr(1);
        app.sendToApp(VARS.historyUrl, params, function(data){
            localStorage.historyAppUpdate = new Date().getTime();
            data = JSON.parse(data);
            var worker = new Worker('js/history_worker.js');
            worker.onmessage = function (event) {
                var data = event.data;
                if( data.payload == 'saved' ){
                    var bg = chrome.extension.getBackgroundPage();
                    bg.AppEvents.fire('history.append', data.event);
                } else if( data.payload == "log" ){
                    console.log( "debug: ", data.data  )
                }
            }
            worker.onerror = function (event) {
                console.error( "From history worker error (getHistoryItems): ", event )
            }
            worker.postMessage({payload:'save',data:data});
            
        },'POST');
    },
    saveHistory: function(data){
        var worker = new Worker('js/history_worker.js');
        worker.onmessage = function (event) {
            var data = event.data;
            if( data.payload == 'saved' ){
                var bg = chrome.extension.getBackgroundPage();
                bg.AppEvents.fire('history.append', data.event);
            }
        }
        worker.onerror = function (event) {
            console.error( "From history worker error (getHistoryItems): ", event )
        }
        worker.postMessage({payload:'saveitem',data:data});
    }
    //
}
