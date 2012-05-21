!function( $ ) {
    $(document).ready(function() {
        var dlg = $('#modal-confirm-delete');
        var form = dlg.find('form');

        // Manually setup the trigger.
        dlg.find('.btn-primary').click(function() {

            // Extract the node and tree.
            var node = dlg.prop('node');
            var tree = node.closest('.tree');

            // Modify the url.
            form.ajax_form({
                url: '/node/' + node.attr('pk') + '/delete/',
                ctrls: dlg.find('.btn'),
                success: function(response) {

                    // Close the dialog.
                    dlg.modal('hide');

                    // Remove all instances.
                    tree.tree('delete_node', node);
                }
            });

            // Submit.
            form.submit();

            // Return false to prevent form submition.
            return false;
        });
    });
}( window.jQuery || window.ender );
