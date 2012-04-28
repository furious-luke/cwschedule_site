$(function () {
    $(document).ready(function() {

	server = sinon.fakeServer.create();
	server.respondWith(
	    'basic',
	    [
		200,
		{'Content-Type': 'application/json'}, // Could be 'text/html'
		'{"status": "success"}'
	    ]
	);
	server.respondWith(
	    'errors',
	    [
		200,
		{'Content-Type': 'application/json'}, // Could be 'text/html'
		'{"status": "error", "form_errors": {"name": ["Bad name", "Something else"], "age": ["Bad age"]}}'
	    ]
	);

	$('.waiting').waiting(false);

	$('#basic').ajax_form({
	    url: 'basic',
	    ctrls: $('#basic #id_submit')
	});

	$('#errors').ajax_form({
	    url: 'errors',
	    ctrls: $('#errors #id_submit')
	});

	$('#restore').ajax_form({
	    url: 'basic',
	    ctrls: $('#restore #id_name, #restore #id_age')
	});

	$('.submit').click(function() {
	    var $this = $(this);
	    $this.closest('form').submit();
	    setTimeout(function() { server.respond(); }, 1000);
	    return false;
	});

	$('.reset').click(function() {
	    $(this).closest('form').ajax_form('reset');
	});

    });
});