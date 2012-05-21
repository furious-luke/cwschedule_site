///
///
///
function children_loaded(node) {
    return node.children('.children').children().length > 0;
}

///
///
///
function load_node(node, pk, expand, callback) {
    if(node == undefined)
        node = default_tree().children('.root');

    // Put a waiting thingy in the container.
    var node_children_ctr = node.children('.children');
    var node_placeholder = $('<div class="node placeholder"></div>');
    node_children_ctr.prepend(node_placeholder)
    var waiting = $('img.waiting:hidden').clone();
    node_placeholder.append(waiting);
    waiting.show();

    loaded_node = $('<div style="display:none"></div>')
    loaded_node.load(
    	'/node/' + pk + '/',
    	function(response, status) {
	    waiting.remove();
            node_placeholder.remove();
    	    if(status == 'success') {

                // Replace the placeholder with the loaded value.
                loaded_node = loaded_node.children();
                node_children_ctr.prepend(loaded_node);

                // Setup the navigation.
                setup_node_navigation(loaded_node, expand, callback);

                // Call the callback.
		if(callback)
		    callback.call(loaded_node);
    	    }
    	    else {
    		alert('Server error.');
    	    }
	}
    );
}

///
///
///
function load_children(node, expand, callback) {

    // Put a waiting thingy in the container.
    var node_children_ctr = node.children('.children');
    var waiting = $('img.waiting:hidden').clone();
    node_children_ctr.append(waiting);
    waiting.show();

    pk = node.attr('pk');
    node_children_ctr.load(
    	'/node/' + pk + '/children/',
    	function(response, status) {
	    waiting.remove();
    	    if(status == 'success') {

                // Setup the navigation for each child node.
                node_children_ctr.children('.node').each(function() {
                    setup_node_navigation($(this), expand, callback);
                });

                // Call the callback.
		if(callback)
		    callback.call(node_children_ctr.children('.node'));
    	    }
    	    else {
    		alert('Server error.');
    	    }
	}
    );
}

///
/// Toggle branch open/closed.
///
function toggle_tree_branch(node, expand, toggle_callback, load_callback) {
    var node_children_ctr = node.children('.children');
    var node_children = node_children_pks(node);

    // In checking for children, I check both for potential children (those unloaded)
    // and actual children (those currently instanced).
    var has_children = node_children.length > 0 || node_children_ctr.find('> .node:first').length > 0;

    if(has_children) {
        var left_ctrls = node.find('> .container > .left-controls');
        var open_btn = left_ctrls.find('.expand');
        var close_btn = left_ctrls.find('.collapse');
	node_children_ctr.toggle(expand);
	open_btn.toggle((expand == undefined) ? undefined : !expand);
	close_btn.toggle(expand);

	if(node_children_ctr.is(':visible') && !children_loaded(node))
	    load_children(node, undefined, load_callback);
	else if(toggle_callback)
	    toggle_callback();
    }
    else {
	// node_children_ctr.toggle(expand);
	// if(load_callback)
	//     load_callback();
    }
}

function setup_node_navigation(node, expand, load_callback) {
    if(expand == undefined)
	expand = false;

    var left_ctrls = node.find('> .container > .left-controls');
    var open_btn = left_ctrls.find('.expand');
    var close_btn = left_ctrls.find('.collapse');
    var node_children = node.children('.children');
    var has_children = node_has_child(node);
    node_children.toggle(has_children && expand);
    open_btn.toggle(has_children && !expand);
    close_btn.toggle(has_children && expand);
    open_btn.click(function() {
	toggle_tree_branch($(this).closest('.node'), undefined, undefined, load_callback);
    });
    close_btn.click(function() {
	toggle_tree_branch($(this).closest('.node'), undefined, undefined, load_callback);
    });
}

///
/// Setup expand buttons.
///
function setup_tree_navigation(tree, expand, load_callback) {
    tree = default_tree(tree);
    if(expand == undefined)
	expand = false;

    var nodes = tree.find('.root .node');
    nodes.each(function() {
	var node = $(this);
	setup_node_navigation(node, expand, load_callback);
    });
}
