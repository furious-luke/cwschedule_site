///
/// Find the default flattened tree.
///
function default_flat_tree(flat_tree) {
    if(flat_tree == undefined)
	flat_tree = $('.flat-tree');
    return flat_tree
}

///
/// Find the default hierarchical tree.
///
function default_tree(tree) {
    if(tree == undefined)
	tree = $('.tree');
    return tree
}

///
/// Extract the parents or children pks from nods.
///
function node_relationship_pks(node, rel) {
    var array = node.attr(rel);
    if(array == undefined)
	return new Array();

    array = array.split(' ');
    if(array.length > 0) {
	if(array[0] == '')
	    return new Array();
    }

    return array;
}

///
/// Extract children pks from node.
///
function node_children_pks(node) {
    return node_relationship_pks(node, 'ch');
}

///
/// Extract parent pks from node.
///
function node_parent_pks(node) {
    return node_relationship_pks(node, 'pa');
}

///
/// Extract parents or children from node.
///
function node_relationships(node, rel, flat_tree) {
    var array = node_relationship_pks(node, rel);
    for(var ii = 0; ii < array.length; ++ii)
	array[ii] = '.node[pk="' + array[ii] + '"]'
    return flat_tree.find(array.join(', '));
}

///
/// Extract children from node.
///
function node_children(node, flat_tree) {
    return node_relationships(node, 'ch', flat_tree);
}

///
/// Extract parents from node.
///
function node_parents(node, flat_tree) {
    return node_relationships(node, 'pa');
}

///
///
///
function node_has_parent(node) {
    var pa = node.attr('pa');
    return !(pa == '' || pa == undefined);
}

///
///
///
function node_has_child(node) {
    var ch = node.attr('ch');
    return !(ch == '' || ch == undefined);
}

///
///
///
function node_has_child_pk(node, pk) {
    var children = node_children_pks(node);
    var idx = children.indexOf(pk);
    return idx != undefined;
}

///
///
///
function node_remove_child_pk(node, pk) {
    var children = node_children_pks(node);
    var idx = children.indexOf(pk);
    if(idx != undefined) {
	children.splice(idx, 1);
	node.attr('ch', children.join(' '));
    }
}

///
///
///
function node_remove_parent_pk(node, pk) {
    var parents = node_parent_pks(node);
    var idx = parents.indexOf(pk);
    if(idx != undefined) {
	parents.splice(idx, 1);
	node.attr('pa', parents.join(' '));
    }
}

///
///
///
function node_prepend_child_pk(node, pk) {
    var cur = node.attr('ch');
    if(cur)
        cur = pk + ' ' + cur;
    else
        cur = pk + '';
    node.attr('ch', cur);
}

///
/// Copy and append node to a location in the DOM.
///
function append_node(node, location, flat_tree) {
    flat_tree = default_flat_tree(flat_tree);

    var new_node = node.clone();
    new_node.appendTo(location);
    return new_node;
}

///
/// Get all root nodes.
///
/// Root nodes for this function are considered to be all those
/// that have no parents or that are projects.
///
function root_nodes(flat_tree) {
    flat_tree = default_flat_tree(flat_tree);
    return flat_tree.find('.node[pa=""], .node[kind="P"]');
}

///
/// Construct branch of a tree.
///
function grow_tree_branch(nodes, location, flat_tree, recurse) {
    flat_tree = default_flat_tree(flat_tree);
    if(recurse == undefined)
	recurse = true;
    nodes.map(function() {
    	var new_node = append_node($(this), location, flat_tree);
	if(recurse) {
    	    var children = node_children(new_node, flat_tree);
    	    grow_tree_branch(children, new_node.children('.children'), flat_tree);
	}
    });
}

///
/// Construct tree.
///
function grow_tree(tree, flat_tree, only_root) {
    tree = default_tree(tree);
    if(tree == undefined)
        tree = $('<div class="tree"><div class="node root"><div class="children"></div></div></div>');
    flat_tree = default_flat_tree(flat_tree);
    var _root_nodes = root_nodes(flat_tree);
    grow_tree_branch(_root_nodes, tree.find('.root > .children'), flat_tree, only_root);
}
