(function($){
    $.fn.waiting = function(show) {
	return this.each(function() {
	    var $this = $(this);
	    if(show || show == undefined)
		local_show = 'block';
	    else
		local_show = 'none';
	    $this.css({
		'display': local_show,
		'background-image': 'url(/waiting/images/waiting.gif)',
		'background-position': 'center',
		'background-repeat': 'no-repeat'
	    });
	});
    }
})(jQuery);
