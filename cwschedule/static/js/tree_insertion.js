///
/// Update other instances of node.
///
function node_changed(node) {
    var all_insts = $('.node[pk="' + node.attr('pk') + '"]');
    all_insts.map(function() {
	var equality = $(this).is(node);
    	if(!equality)
    	    $(this).replaceWith(node.clone(true));
    });
}

function node_linked(node) {
    if(node_parent_pks(node).length) {
	var root_node = node.closest('.root-node');
	var pk = parseInt(node.attr('pk'));
	var nodes_to_del = root_node.find('> .node-children > .node[pk="' + pk + '"][kind="T"]');
	nodes_to_del.remove();
    }
}

function remove_node(node) {
    var tree = node.closest('.tree');
    var pk = node.attr('pk');
    var parent_pk = node.parent().closest('.node').attr('pk');
    var all_parent_nodes = tree.find('.node[pk="' + parent_pk + '"]');
    if(all_parent_nodes.length) {
	all_parent_nodes.map(function() {
	    var node = $(this).find('> .node-children > .node[pk="' + pk + '"]');
	    node_remove_child_pk($(this), pk);
	    node.remove();
	    if($(this).find('> .node-children > .node').length == 0 || !node_has_child($(this))) {
		toggle_tree_branch($(this), false);
		$(this).find('> .node-content .open-branch-button').hide();
		$(this).find('> .node-content .close-branch-button').hide();
	    }
	})
    }
    else {
	node.remove();
    }
}

function unlink_node(node) {
    var tree = node.closest('.tree');
    var pk = node.attr('pk');
    var parent_pk = node.parent().closest('.node').attr('pk');
    var all_parent_nodes = tree.find('.node[pk="' + parent_pk + '"]');
    all_parent_nodes.map(function() {
	if($(this).attr('pk') == parent_pk) {
	    var node = $(this).find('> .node-children > .node[pk="' + pk + '"]');
	    node_remove_child_pk($(this), pk);
	    node.remove();
	    if($(this).find('> .node-children > .node').length == 0 || !node_has_child($(this))) {
		toggle_tree_branch($(this), false);
		$(this).find('> .node-content .open-branch-button').hide();
		$(this).find('> .node-content .close-branch-button').hide();
	    }
	}
    });
}

function cancel_new_node_clicked(btn) {
    btn.closest('.new-node-controls').remove();
}

function cancel_add_node_clicked(btn) {
    btn.closest('.add-node-controls').remove();
}

function save_newadd_node_clicked(btn) {
    var form = btn.closest('form');
    form.submit();
}

function replace_controls_with_node(ctrls, pk) {
    var tmp = $('<div style="height:32px;margin-left:28px;margin-top:2px;"></div>');
    tmp.append($('body > .container > .content > .waiting').clone().show());
    var tmp_node = $('<div class="tmp-node" style="display:none"></div>');
    tmp.append(tmp_node);
    ctrls.after(tmp);
    ctrls.remove();

    tmp_node.load(
	'/ajax/node/' + pk + '/',
	function(response, status) {
	    if(status == 'success') {
		setup_tree_insertion(tmp, true);
		var new_node = tmp_node.children('.node');
		var parent = tmp_node.closest('.node');
		tmp.replaceWith(new_node);
		if(parent.find('> .node-children > .node').length == 1) {
		    parent.attr('ch', pk);
		    parent.children('.node-content').find('.close-branch-button').show();
		}
		else {
		    parent.attr('ch', parent.attr('ch') + ' ' + pk);
		}
		setup_node_navigation(new_node);
		setup_node_details(new_node);
		node_changed(parent);
		node_linked(new_node);
	    }
	    else {
		tmp.remove();
		alert('Server error, you may need to refresh the page.');
	    }
	}
    );
}

function show_new_node_controls(node, project) {
    var children_ctr = node.children('.node-children');
    var ctrls = $('body > .container > .content > .new-node-controls:first').clone();
    enable_button_hover(ctrls);
    ctrls.find('.cancel-button').click(function() {
	cancel_new_node_clicked($(this));
    });
    ctrls.find('.save-button').click(function() {
	save_newadd_node_clicked($(this));
    });

    children_ctr.prepend(ctrls);
    ctrls.show();
    ctrls.find('#id_name').focus();

    var url = '/ajax/';
    if(project)
	url += 'project';
    else
	url += 'task';
    url += '/new/';
    if(node.attr('pk'))
	url += node.attr('pk') + '/'

    var form = ctrls.find('form');
    form.ajaxForm({
	url: url,
    	dataType: 'json',
	beforeSubmit: function(form_data, form) {
	    form.find('input').attr('disabled', true);
	    form.find('.button').attr('disabled', true);
    	},
    	success: function(response) {
	    form.find('input').attr('disabled', false);
	    form.find('.button').attr('disabled', false);
    	    if(response['status'] == 'success') {
		replace_controls_with_node(ctrls, response.node.pk);
    	    }
    	    else {
    		alert('Server error.');
    	    }
    	},
    	error: function(response) {
	    form.find('input').attr('disabled', false);
	    form.find('.button').attr('disabled', false);
    	    alert('Server error.');
    	}
    });
}

function show_add_node_controls(node, project) {
    var children_ctr = node.children('.node-children');
    var ctrls = $('body > .container > .content > .add-node-controls:first').clone();
    enable_button_hover(ctrls);
    ctrls.find('#id_node').autocomplete({
    	source: '/ajax/node/ac/',
    	minLength: 2,
	focus: function(event, ui) {
	    $(this).val(ui.item.label);
	    return false;
	},
	select: function(event, ui) {
	    $(this).val(ui.item.label);
	    $(this).attr('pk', ui.item.pk);
	    return false;
	}
    });
    ctrls.find('.cancel-button').click(function() {
	cancel_add_node_clicked($(this));
    });
    ctrls.find('.save-button').click(function() {
	save_newadd_node_clicked($(this));
    });

    children_ctr.prepend(ctrls);
    ctrls.show();
    ctrls.find('#id_node').focus();

    var form = ctrls.find('form');
    form.ajaxForm({
	url: '/ajax/node/add/' + node.attr('pk') + '/',
    	dataType: 'json',
	beforeSubmit: function(form_data, form) {
	    form.find('input').attr('disabled', true);
	    form.find('.button').attr('disabled', true);

	    // Replace the given data with the stored pk.
	    for(var ii=0, len=form_data.length; ii < len; ++ii) {
		if(form_data[ii].name == 'node')
		    form_data[ii].value = form.find('#id_node').attr('pk');
	    }
    	},
    	success: function(response) {
	    form.find('input').attr('disabled', false);
	    form.find('.button').attr('disabled', false);
    	    if(response['status'] == 'success') {
		replace_controls_with_node(ctrls, response.node.pk);
    	    }
    	    else {
		show_form_errors(form, response['form_errors']);
    	    }
    	},
    	error: function(response) {
	    form.find('input').attr('disabled', false);
	    form.find('.button').attr('disabled', false);
    	    alert('Server error.');
    	}
    });
}

function newadd_node_clicked(node, show_controls, project) {
    var children_ctr = node.children('.node-children');
    if(children_ctr.is(':hidden')) {
	toggle_tree_branch(node, undefined, function() {
	    show_controls(node, project);
	});
    }
    else
	show_controls(node, project);
}

function unlink_node_clicked(node) {
    var dlg = $('#unlink-node-confirm');
    dlg.prop('cur_node', node);
    dlg.find('strong').text(node.find('> .node-content .node-center p').text());
    dlg.dialog('open');
}

function delete_node_clicked(node) {
    var dlg = $('#delete-node-confirm');
    dlg.prop('cur_node', node);
    dlg.find('strong').text(node.find('> .node-content .node-center p').text());
    dlg.dialog('open');
}

///
/// Setup insertion buttons.
///
function setup_tree_insertion(tree, enable) {
    if(enable == undefined)
	enable = true;

    var btns = tree.find('.new-node-button, .add-node-button, .delete-node-button, .unlink-node-button');
    btns.hide();
    if(enable) {
	var node_panels = tree.find('.node-panel');
	node_panels.hover(function() {
	    $(this).find('.new-node-button, .add-node-button, .delete-node-button').fadeIn(100);
	    if(node_has_parent($(this).closest('.node')))
		$(this).find('.unlink-node-button').fadeIn(100);
	}, function() {
	    $(this).find('.new-node-button, .add-node-button, .delete-node-button').fadeOut(100);
	    if(node_has_parent($(this).closest('.node')))
		$(this).find('.unlink-node-button').fadeOut(100);
	});

	var new_btns = tree.find('.new-node-button');
	new_btns.click(function() {
	    newadd_node_clicked($(this).closest('.node'), show_new_node_controls);
	});
	var add_btns = tree.find('.add-node-button');
	add_btns.click(function() {
	    newadd_node_clicked($(this).closest('.node'), show_add_node_controls);
	});
	var del_btns = tree.find('.delete-node-button');
	del_btns.click(function() {
	    delete_node_clicked($(this).closest('.node'));
	});
	var unl_btns = tree.find('.unlink-node-button');
	unl_btns.click(function() {
	    unlink_node_clicked($(this).closest('.node'));
	});
    }

    $('#delete-node-confirm').dialog({
	autoOpen: false,
        modal: true,
	resizable: false,
        buttons: {
	    "Ok": function () {
		var node = $(this).prop('cur_node');
                $(this).dialog("close");
		var pk = node.attr('pk');
		$.post(
		    '/ajax/node/' + pk + '/delete/',
		    function(response, status) {
			if(status == 'success') {
			    node.closest('.tree').find('.node[pk=' + pk + ']').map(function() {
				remove_node($(this));
			    })
			}
			else {
			    alert('Server error.');
			}
		    },
		    'json'
		).error(function() {
		    alert('Server error.');
		});
	    },
	    "Cancel": function () {
                $(this).dialog("close");
	    }
	}
    });

    $('#unlink-node-confirm').dialog({
	autoOpen: false,
        modal: true,
	resizable: false,
        buttons: {
	    "Ok": function () {
		var node = $(this).prop('cur_node');
                $(this).dialog("close");
		var parent = node.parent().closest('.node');
		var pk = node.attr('pk');
		var parent_pk = parent.attr('pk');
		$.post(
		    '/ajax/node/' + pk + '/unlink/' + parent_pk + '/',
		    function(response, status) {
			if(status == 'success') {
			    unlink_node(node);
			}
			else {
			    alert('Server error.');
			}
		    },
		    'json'
		).error(function() {
		    alert('Server error.');
		});
	    },
	    "Cancel": function () {
                $(this).dialog("close");
	    }
	}
    });
}
