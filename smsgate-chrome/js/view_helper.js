window.addEventListener('load', function(){
    parseHelpHints();
});

function parseHelpHints(){
    var elements = document.querySelectorAll('div.hint-info');
    var cnt = elements.length;
    if( cnt == 0 ) return;

    for (var i = 0, obj; i < cnt; i++) {
        obj = elements[i];
        var label = obj.getAttribute('title') || 'Pomoc';
        obj.removeAttribute('title');

        var wrapper = obj.wrap('div');
        wrapper.className = 'hint-wrapper';
        var title = document.createElement('div');
        title.className = 'hint-title';
        title.innerHTML = label;
        wrapper.insertBefore(title, obj);

        title.addEventListener( 'click' , function(e){
            var parent = this.parentNode;
            var hint = parent.querySelector('div.hint-info');
            if( parent.hasClass('opened') ){
                parent.removeClass('opened');
                hint.style.height = 0+'px';
            } else {
                parent.addClass('opened');
                hint.style.height = hint.scrollHeight+'px';
            }
        });
    }

}