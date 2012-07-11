///
///
///
function show_active(work) {
    var active = $('.active-align-right');
    if(work.active_pk != active.attr('pk')) {
	active.attr('pk', work.active_pk);
	active.slideUp(200);
	setTimeout(function() {
	    active.find('p > strong').text(work.node_name);
	    active.slideDown(200);
	}, 200);
    }
}

///
///
///
function hide_active() {
    $('.active-align-right').slideUp(200);
    $('.control.activate:hidden').show();
}

!function( $ ) {
    $(document).ready(function() {

	$('.stop-tracking-button').click(function() {
	    var btn = $(this);
	    btn.attr('disabled', true).css('cursor', 'default');
	    $('.control.activate').attr('disabled', true);
	    var pk = $('.active-align-right').attr('pk');
	    $.post(
		'/active/' + pk + '/deactivate/',
		function(response, status) {
		    btn.removeAttr('disabled').css('cursor', 'pointer');
		    $('.control.activate').removeAttr('disabled');
		    if(status == 'success') {
			hide_active();
		    }
		    else {
			alert('Server error.');
		    }
		},
		'json'
	    ).error(function() {
		btn.removeAttr('disabled').css('cursor', 'pointer');
		$('.control.activate').removeAttr('disabled');
		alert('Server error.');
	    });
	});

    });
}( window.jQuery || window.ender );
