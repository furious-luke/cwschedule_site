!function( $ ) {
    $(document).ready(function() {
        var dlg = $('#modal-details');

        // Manually setup the trigger.
        dlg.find('.btn.save').click(function() {

            // Extract the node and tree.
            var form = dlg.find('form');
            var node = dlg.prop('node');
            var tree = node.closest('.tree');
            var pk = node.attr('pk');

            // Modify the url.
            form.ajax_form({
                url: '/node/' + pk + '/update/',
                ctrls: dlg.find('.btn'),
                success: function(response) {

                    // Close the dialog.
                    dlg.modal('hide');

                    // Reload the item maybe.
                    tree.tree('update_node', pk);
                }
            });

            // Submit.
            form.submit();

            // Return false to prevent form submition.
            return false;
        });
    });
}( window.jQuery || window.ender );
