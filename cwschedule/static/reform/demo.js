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

	$('#reform').reform();

    });
});
