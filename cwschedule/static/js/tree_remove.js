function handle_emptied_node(node) {
    if(node && !node_has_child(node) && node.find('> .children > .node:first').length == 0) {

        // Remove the navigation button.
        node.find('> .container > .left-controls > .control').hide();
    }
}

///
/// Unlink node from parent.
///
/// Remove the instance pointed to, handling emptying parents.
///
function tree_unlink_node(node) {
    var tree = node.closest('.tree');
    var root = tree.find('.node.root');
    var parent = node.parent().closest('.node');

    // Eliminate the pk from the parent and remove the node itself.
    node_remove_child_pk(parent, node.attr('pk'));
    node.detach();

    // Handle emptying a node's children.
    handle_emptied_node(parent);

    // Decide whether to put the node in the root.
    if(!tree.find('.node[pk="' + node.attr('pk') + '"]').length) {
        node.prependTo(root.find('> .children')).show();

        // Hide the node's unlink action.
        node.find('> .container .actions .unlink').hide();

        // Remove reference to the parent.
        node_remove_parent_pk(node, parent.attr('pk'));
    }
    else
        node.remove();
}

///
/// Unlink all instances of node from parent.
///
function tree_unlink_all_nodes(node) {
    var tree = node.closest('.tree');
    var parent = node.parent().closest('.node');
    tree.find('.node[pk="' + node.attr('pk') + '"]').each(function() {

        // Only unlink if it has the same parent.
        if($(this).parent().closest('.node').attr('pk') == parent.attr('pk'))
            tree_unlink_node($(this));
    });

    // Now find parents with unloaded children referring to this node.
    tree.find('.node[pk="' + parent.attr('pk') + '"]').each(function() {

        // Does it contain a reference to the child node?
        if(node_has_child($(this), node.attr('pk'))) {
            node_remove_child_pk($(this), node.attr('pk'));
            handle_emptied_node($(this));
        }
    });
}

///
/// Remove node from tree.
///
/// Remove the instance pointed to, handling emptying parents.
///
function tree_remove_node(node) {
    var tree = node.closest('.tree');
    var root = tree.find('.node.root');
    var parent = node.parent().closest('.node');

    // Begin by moving the children to the body temporarily. I do
    // this to keep them in the DOM.
    var children = node.find('> .children > .node');
    children.hide().appendTo($('body'));

    // Eliminate the pk from the parent and remove the node itself.
    node_remove_child_pk(parent, node.attr('pk'));
    node.remove();

    // Handle emptying a node's children.
    if(parent && !node_has_child(parent) && parent.find('> .children > .node:first').length == 0) {

        // Remove the navigation button.
        parent.find('> .container > .left-controls > .control').hide();
    }

    // Now decide whether to keep the children or not.
    children.each(function() {
        if(!tree.find('.node[pk="' + $(this).attr('pk') + '"]').length)
            $(this).prependTo(root.find('> .children')).show();
    });
}

///
/// Remove all instances of node from tree.
///
function tree_remove_all_nodes(node) {
    var pk = node.attr('pk');
    var tree = node.closest('.tree');
    tree.find('.node[pk="' + pk + '"]').each(function() {
        tree_remove_node($(this));
    });

    // Now find parents with unloaded children referring to this node.
    // TODO: This might be slow as we're checking all nodes.
    tree.find('.node').each(function() {
        var $this = $(this);

        // Does it contain a reference to the child node?
        if(node_has_child($this, pk)) {
            node_remove_child_pk($this, pk);
            handle_emptied_node($this);
        }
    });
}
