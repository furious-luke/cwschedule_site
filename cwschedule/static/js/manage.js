function copy_template(tmpl) {
    var copy = tmpl.clone(true);
    return copy.removeAttr('id').show();
}

///
/// Select/deselect nodes.
///
function toggle_nodes() {
    var $this = $(this);
    var center = $this.find('> .container .center');

    // Toggle the popover.
    center.popover('toggle');

    // Toggle the selected class.
    $this.toggleClass('selected');

    // Setup the popover.
    var popover = $('body > .popover');
    popover.find('[title]').tooltip();
    popover.find('.control.edit').click(function() {
        alert('edit');
    });
    popover.find('.control.new').click(function() {
        insert_new_node_controls($this.children('.children:first'));
    });
    popover.find('.control.delete').click(function() {
        $('#modal-confirm-delete .modal-body p b').html(
            center.find('.name').text()
        );
    });
}

///
/// Setup nodes.
///
function setup_nodes() {
    var $this = $(this);
    var centers = $this.find('> .container .center');

    // Prepare popovers.
    centers.popover({
        title: 'Actions',
        content: copy_template($('#template-actions')).html(),
        trigger: 'manual'
    });

    // Prepare action for clicking nodes.
    centers.click(function() {
        var $cur_this = $(this);
        var node = $cur_this.closest('.node');
        var selected = $('.node.selected');
        if( !node.is(selected) )
            selected.each(toggle_nodes);
        toggle_nodes.call(node[0]);
    });

    // Enable all tooltips.
    $this.find('[title]').tooltip();
}

!function( $ ) {
    $(document).ready(function() {

        // Grow the tree.
        grow_tree();
        setup_tree_navigation(undefined, undefined, setup_nodes);

        // Prepare popovers for all the visible nodes.
        $('.node').each(setup_nodes);

        // Setup action for new root node.
        $('.control.new-root').click(function() {
            insert_new_node_controls($('.node.root:first'));
        });

    });
}( window.jQuery || window.ender );
