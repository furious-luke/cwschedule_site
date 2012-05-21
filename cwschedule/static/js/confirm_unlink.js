!function( $ ) {
    $(document).ready(function() {
        var dlg = $('#modal-confirm-unlink');
        var form = dlg.find('form');

        // Manually setup the trigger.
        dlg.find('.btn-primary').click(function() {

            // Extract the node and tree.
            var node = dlg.prop('node');
            var tree = node.closest('.tree');

            // Find the parent to unlink from.
            var parent_pk = node.parent().closest('.node').attr('pk');

            // Modify the url.
            form.ajax_form({
                url: '/node/' + node.attr('pk') + '/unlink/' + parent_pk + '/',
                ctrls: dlg.find('.btn'),
                success: function(response) {

                    // Close the dialog.
                    dlg.modal('hide');

                    // Unlink from specific parent.
                    tree.tree('unlink_node', node);
                }
            });

            // Submit.
            form.submit();

            // Return false to prevent form submition.
            return false;
        });
    });
}( window.jQuery || window.ender );
