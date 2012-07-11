function copy_template(tmpl) {
    var copy = tmpl.clone(true);
    return copy.removeAttr('id').show();
}

///
/// Select/deselect nodes.
///
function toggle_nodes(state) {
    var $this = $(this);
    var center = $this.find('> .container .center');

    // Toggle the right-controls.
    var actions = $this.find('> .container .actions');
    actions.toggle(state);

    // Toggle the selected class.
    $this.toggleClass('selected', state);
}

///
/// Update node event.
///
function node_update(event, tree, node) {
    var center = node.find('> .container > .center');
    var actions = node.find('> .container .actions');

    // Enable all center tooltips.
    center.find('[title]').tooltip();

    // Setup unlink, depends on whether this node has a parent.
    actions.find('.control.unlink').toggle(tree.tree('has_parent', node)).click(function() {
        $('#modal-confirm-unlink .modal-body p b').html(
            $(this).closest('.container').find('.name').text()
        );
        $('#modal-confirm-unlink').prop('node', node);
    });

    // Setup the activate button depending on whether the node is a category
    // and whether the node is already active.
    if(node.attr('kind') == 'P' || $('.active-node').attr('pk') == node.attr('pk'))
        actions.find('.control.activate').hide();
    else {
        actions.find('.control.activate').show();
        actions.find('.control.activate').click(function() {
            // // Ajax request.
            // if(ajax('/node/' + node.attr('pk') + '/activate/')) {
            //     // Show active node.
            // }
        });
    }
}

///
/// Setup node event.
///
function setup_node(event, tree, node) {
    var centers = node.find('> .container .center');

    // Call node_update to catch center related things.
    node_update(event, tree, node);

    // Prepare action for clicking nodes.
    centers.click(function() {
        var $cur_this = $(this);
        var node = $cur_this.closest('.node');
        var selected = $('.node.selected');
        if( !node.is(selected) )
            selected.each(function() {
                toggle_nodes.call(this, false);
            });
        toggle_nodes.call(node[0]);
    });

    // Enable all non-center tooltips.
    node.find('> .container > .left-controls [title]').tooltip();
    node.find('> .container > .right-controls [title]').tooltip();

    // Find the actions container.
    var actions = node.find('> .container .actions');

    // Setup edit.
    actions.find('.control.edit').click(function() {
        var modal_body = $('#modal-details > .modal-body');

        // Clear out any pre-existing content.
        modal_body.html('');

        // Show the waiting bit.
        modal_body.addClass('waiting');

        // Add the node to the dialog properties.
        $('#modal-details').prop('node', node);

        // Load the content.
        modal_body.load(
            '/node/' + node.attr('pk') + '/details/',
            function(response, status) {

                // Clear out the waiting gif.
                modal_body.removeClass('waiting');

                if(status == 'success') {

                    // Activate reform.
                    modal_body.find('.reform').reform();
                }
                else {
                    alert('Server error.');
                }
            }
        );
    });

    // Setup create.
    actions.find('.control.create').click(function() {
        tree.tree('toggle_children', node, true, function() {
            insert_create_node_controls(tree, tree.tree('children_container', node));
        });
    });

    // Setup link.
    actions.find('.control.link').click(function() {
        tree.tree('toggle_children', node, true, function() {
            insert_link_node_controls(tree, tree.tree('children_container', node));
        });
    });

    // Setup delete.
    actions.find('.control.delete').click(function() {
        $('#modal-confirm-delete .modal-body p b').html(
            $(this).closest('.container').find('.name').text()
        );
        $('#modal-confirm-delete').prop('node', node);
    });
}

!function( $ ) {
    $(document).ready(function() {

        // Initialise the tree.
        $('.tree').tree();

        // Setup events.
        $('.tree').on('node_ready', setup_node);
        $('.tree').on('node_update', node_update);

        // Grow the tree.
        $('.tree').tree('grow');

        // Setup action for main controls.
        $('.control.create-root').click(function() {
            insert_create_node_controls($('.tree'), $('.node.root:first > .children:first'));
        }).tooltip();
        $('.control.expand-all').click(function() {
            $('.tree').tree('expand_all');
        }).tooltip();
        $('.control.collapse-all').click(function() {
            $('.tree').tree('collapse_all');
        }).tooltip();

    });
}( window.jQuery || window.ender );
