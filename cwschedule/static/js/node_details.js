function node_edited(node, details) {
    var pk = node.attr('pk');
    var all_nodes = $('.node[pk="' + pk + '"]');

    // Update name.
    var center = all_nodes.find('> .node-content .node-center');
    if(details.completed) {
	center.find('p').text('');
	center.find('p').append($('<del></del>').text(details.name));
    }
    else
	center.find('p').text(details.name);

    // Update kind.
    var kind = center.find('.kind');
    if(details.kind == 'P') {
	if(!kind.length) {
	    center.append($('<div class="kind">P</div>'));
	}

	// If not already a root node, make it one now.
	var root = $('.root-node > .node-children > .node[pk="' + pk + '"]');
	if(!root.length)
    	    $('.root-node > .node-children').append(node.clone(true));
    }
    else {
	kind.remove();

	// If this node has parents remove it from the root.
	var root = $('.root-node > .node-children > .node[pk="' + pk + '"]');
	if(node_parent_pks(node).length)
    	    root.remove();
    }
}

function show_node_details(node) {
    var name = node.find('> .node-content .node-center p').text();
    var dlg = $('<div id="node-dialog dialog" title="' + name + '"></div>');
    var content = $('<div class="dialog-content"></div>');
    var wait = $('#waiting').clone().css('display', 'block').css('margin-left', 'auto').css('margin-right', 'auto').show();
    content.append(wait);
    dlg.append(content);
    dlg.dialog({
	autoOpen: true,
	modal: true,
	position: 'center',
	width: 500,
	height: 420,
	resizable: false,
	buttons: {
	    "Save": function () {
		var form = $(this).find('form');
		form.submit();
	    },
	    "Close": function () {
		$(this).dialog('close');
		$(this).remove();
	    },
	}
    });

    // Hide the save button before we load content.
    dlg.parent().find('div.ui-dialog-buttonset > button:first').hide();

    content.load(
	'/ajax/node/' + node.attr('pk') + '/details/',
	function(response, status) {
	    if(status == 'success') {
		wait.remove();

		// Add events to modifying the repeat period.
		var period = content.find('#id_period');
		if(period.val() == 'NO')
		    content.find('#id_skip').attr('disabled', true);
		period.change(function() {
		    if($(this).val() == 'NO')
			content.find('#id_skip').attr('disabled', true);
		    else
			content.find('#id_skip').removeAttr('disabled');
		});

		// Setup the reforms.
		content.find('.reform').reform();

		// Check if we have a readonly form and, if not, show the save button.
		if(!content.find('fieldset.disabled').length)
		    dlg.parent().find('div.ui-dialog-buttonset > button:first').show();

		$(this).find('#id_dead_line').datetimepicker({
		    dateFormat: 'd M yy',
		    timeFormat: 'hh:mmtt',
		    ampm: true
		});

		$(this).find('fieldset.disabled input, fieldset.disabled textarea').attr('disabled', true);

		var form = $(this).find('form');
		form.ajax_form({
		    ctrls: form.find('input, textarea').add(
			dlg.find('button')).add(
			    dlg.parent().find('div.ui-dialog-buttonset > button')),
		    position: 'topLeft',
    		    success: function(response) {
			dlg.dialog('close');
			dlg.remove();
			node_edited(node, response.node);
    		    },
		    form_error: function(form_errors) {
			form.ajax_form('first_form_error', function(input) {
			    var tab_id = input.closest('.ui-tabs-panel').attr('id');
			    input.closest('.tabs').tabs('select', '#' + tab_id);
			});
		    }
		});

		$(this).find('.tabs').tabs({
		    'show': function() {
			form.ajax_form('show_form_errors');
		    }
		});
		$(this).find('.tabs').css('margin-bottom', 0);
		$(this).find('form').css('margin-bottom', 0);
	    }
	    else {
		dlg.dialog('close');
		dlg.remove();
		alert('Server error.');
	    }
	}
    );
}

function setup_node_details(node) {
    node.find('> .node-content .node-center').click(function() {
	show_node_details(node);
    });
}

function setup_tree_details(tree) {
    tree.find('.node-center').click(function() {
	show_node_details($(this).closest('.node'));
    });
}

!function( $ ) {
    $(document).ready(function() {

	$('.node-center').click(function() {
	    show_node_details($(this).closest('.node'));
	});

    });
}( window.jQuery || window.ender );
