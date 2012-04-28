///
///
///
function coalesce_branch_view_container(bvc) {
    if(bvc == undefined)
	bvc = $('.branch-view-container');
    return bvc;
}

///
///
///
function hide_branch(bvc) {
    bvc = coalesce_branch_view_container(bvc);
    var view = bvc.find('.branch-view:visible');
    var branch = view.find('.branch:visible');
    view.hide();
    branch.hide();
}

///
///
///
function setup_tree_branch_view(tree, bvc) {
    bvc = coalesce_branch_view_container(bvc);
    tree = default_tree(tree);
    var btns = tree.find('.branch-view-button');
    btns.click(function() {
	hide_branch(bvc);

	var node = $(this).closest('.node');
	var pk = node.attr('pk');
	var view = bvc.find('.branch-view[pk="' + pk + '"]');
	var branch = view.find('.branch:first');
	branch.show();
	view.show();
	bvc.fadeIn(100);

	$('#branch-nav-next').toggle(branch.next().length > 0);
	$('#branch-nav-prev').toggle(branch.prev().length > 0);

	var node_list_top = node.closest('.node-list').offset().top;
	var node_top = node.position().top;
	bvc.css('margin-top', node_top - node_list_top);
    });
    btns.map(function() {
	$(this).toggle(node_parent_pks($(this).closest('.node')).length > 0);
    });

    bvc.find('input[type="button"]').button();
    bvc.find('#branch-nav-next').click(function() {
	var view = bvc.find('.branch-view:visible');
	var branch = view.find('.branch:visible');
	branch.hide();
	branch.next().show();
	if(!branch.next().next().length)
	    $(this).hide();
	bvc.find('#branch-nav-prev').show();
	return false;
    });
    bvc.find('#branch-nav-prev').click(function() {
	var view = bvc.find('.branch-view:visible');
	var branch = view.find('.branch:visible');
	branch.hide();
	branch.prev().show();
	if(!branch.prev().prev().length)
	    $(this).hide();
	bvc.find('#branch-nav-next').show();
	return false;
    });
    bvc.find('.branch-nav-close').click(function() {
	hide_branch(bvc);
	bvc.hide();
    });
}
