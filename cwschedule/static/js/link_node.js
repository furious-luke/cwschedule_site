function remove_link_node_controls(tree, controls) {
    var parent = controls.parent().closest('.node');
    controls.remove();
    if(!tree.tree('has_child', parent) && !parent.hasClass('root'))
        tree.tree('toggle_children', parent, false);
    $('body > .tooltip').remove();
}

function insert_link_node_controls(tree, location) {
    var controls = copy_template($('#template-link-node'));
    location.prepend(controls);

    // Setup tooltips.
    controls.find('[title]').tooltip();

    // Cancel button.
    controls.find('.control.cancel').click(function() {
        remove_link_node_controls(tree, controls);
    });

    // Save button.
    controls.find('.control.save').click(function() {
        var form = controls.find('form');

        // Setup the URL.
        var parent = location.closest('.node');
        var url = '/node/' + parent.attr('pk') + '/link/';

        // Setup the form.
        form.ajax_form({
            url: url,
            ctrls: controls.find('.control'),
            before_submit: function(form_data, form) {

	        // Replace the given data with the stored pk.
	        for(var ii = 0, len = form_data.length; ii < len; ++ii) {
		    if(form_data[ii].name == 'node')
		        form_data[ii].value = form.find('#id_node').prop('pk');
	        }
            },
            success: function(response) {
                controls.remove();
                $('body > .tooltip').remove();

                // Insert the node.
                tree.tree('load_node', response.pk);

                // // Prepend the node to the children of our parent.
                // var parent = location.closest('.node');
                // node_prepend_child_pk(parent, response.pk);
                // load_node(parent, response.pk, false, setup_nodes);

                // // Check for the existence of the linked node on the root and remove it.
                // location.closest('.tree').find('.root > .children > .node[pk="' + parent.attr('pk') +  '"]').remove();
            }
        });

        // Submit.
        form.submit();
    });

    // Setup the typeahead.
    controls.find('#id_node').typeahead({
        source: function(typeahead, query) {
            return $.ajax({
                url: '/ac/path/?q=' + query,
                success: function(data) {
                    return typeahead.process(data);
                },
                dataType: 'json'
            });
        },
        property: 'name',
        onselect: function(obj) {
            controls.find('#id_node').prop('pk', obj.pk);
        }
    });
}
