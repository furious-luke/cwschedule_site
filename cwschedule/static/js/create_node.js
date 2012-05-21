function remove_create_node_controls(tree, controls) {
    var parent = controls.parent().closest('.node');
    controls.remove();
    if(!tree.tree('has_child', parent) && !parent.hasClass('root'))
        tree.tree('toggle_children', parent, false);
    $('body > .tooltip').remove();
}

function insert_create_node_controls(tree, location) {
    var controls = copy_template($('#template-create-node'));
    location.prepend(controls);

    // Setup tooltips.
    controls.find('[title]').tooltip();

    // Cancel button.
    controls.find('.control.cancel').click(function() {
        remove_create_node_controls(tree, controls);
    });

    // Save button.
    controls.find('.control.save').click(function() {
        var form = controls.find('form');

        // If this is not a root level node, set the URL to
        // insert as a child.
        var parent = location.closest('.node');
        var url;
        if(parent.hasClass('root'))
            url = '/node/create/';
        else
            url = '/node/' + parent.attr('pk') + '/create/';

        // Setup the form.
        form.ajax_form({
            url: url,
            ctrls: controls.find('.control'),
            success: function(response) {
                controls.remove();
                $('body > .tooltip').remove();

                // Insert the node.
                tree.tree('load_node', response.pk);
            }
        });

        // Submit.
        form.submit();
    });
}
