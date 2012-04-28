function insert_new_node_controls(location) {
    var content = copy_template($('#template-new-node'));
    location.prepend(content);

    // Setup the controls.
    content.find('[title]').tooltip();
    content.find('.control.cancel').click(function() {
        content.remove();
        $('body > .tooltip').remove();
    });
    content.find('.control.save').click(function() {
        $(this).closest('form').submit();
    });
    content.find('form').ajax_form({
        ctrls: content.find('.control')
    });
}
