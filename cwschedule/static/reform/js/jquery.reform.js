(function($){

    function clear_form_elements(form) {
	form.find('input[type="text"], input[type="password"], input[type="textarea"], input[type="hidden"], text, password, textarea, hidden').val('');
	form.find('input[type="radio"], input[type="checkbox"], radio, checkbox').prop('checked', false);
	form.find('input[type="select"], select').prop('selectedIndex', -1);
    }

    function create_remove_button($this, index) {
	var btn = $('<a class="reform-remove-btn" href="#" index="' + index + '">Remove</a>');
	btn.click(function() {
	    methods.remove.call($this, $(this).attr('index'));
	    return false;
	});
	return btn;
    }

    function convert_form($this, form, index, existing) {
	var form_ctr = $('<div id="reform-form-ctr-' + index + '" class="reform-form-ctr" />').append(
	    form.attr('id', 'reform-form-' + index)
	);
	if(existing) {

	    // Need to have the "*-DELETE" checkbox to do this. We will just
	    // convert the checkbox to a jQuery UI button.
	    // form.find('input[id$="-DELETE"]').buttonset();// {
	    // 	icons: {
	    // 	    primary: 'ui-icon-trash'
	    // 	},
	    // 	text: false
	    // });
	    return form_ctr;
	}
	else {
	    return form_ctr.append(create_remove_button($this, index));
	}
    }

    function form_container_index(form_ctr) {
	var id = form_ctr.attr('id');
	return parseInt(id.slice(id.lastIndexOf('-') + 1));
    }

    function reindex_form_container(form_ctr, old_index, new_index) {

	// First thing, I need to discover the current index.
	var match = '-' + old_index + '-', replace = '-' + new_index + '-';

	// Modify the id of the form container.
	form_ctr.attr('id', form_ctr.attr('id').replace('-' + old_index, '-' + new_index));

	// Modify the id of the form element.
	form_ctr.find('.reform-form').attr('id', 'reform-form-' + new_index);

	// Hunt down anything with an id or a name attribute, changing the index
	// in each one.
	form_ctr.find('[id], [name]').each(function() {
	    var $this = $(this);
	    var attrs = ['id', 'name'];
	    for(var ii = 0; ii < attrs.length; ++ii) {
		var attr = attrs[ii];
		var val = $this.attr(attr);
		if(val != undefined)
		    $this.attr(attr, val.replace(match, replace));
	    }
	});

	// The element immediately following the form container will be the
	// removal button.
	form_ctr.children('.reform-remove-btn').attr('index', new_index);
    }

    var methods = {

 	///
	/// Initialise the plugin.
	///
	init: function(options) {
	    return this.each(function() {
		var $this = $(this);

		// Prepare plugin data if not already done.
		var data = $this.data('reform');
		if(!data) {
		    $this.data('reform', $.extend({
			form_selector: '.reform-form',
			remove_template: true,
			index: 0,
			total: undefined,
			initial_count: undefined
		    }, options));
		    data = $this.data('reform');
		}

		// Grab the total forms and initial count.
		data.total = $this.find('input[id$="-TOTAL_FORMS"]');
		data.initial_count = $this.find('input[id$="-INITIAL_FORMS"]').val();

		// Clone the last form into a template.
		var existing = $this.find(data.form_selector);
		if(data.remove_template) {
		    data.template = existing.last().remove();
		    existing = $this.find(data.form_selector);

		    // If we're removing the last template we need to reduce the
		    // number of forms by one, right off the bat.
		    data.total.val(parseInt(data.total.val()) - 1);
		}
		else
		    data.template = existing.last().clone();

		// Look for the delete checkbox and label, removing them if they're there.
		data.template.find('label[for$="-DELETE"], input[id$="-DELETE"]').remove();

		// Create containers.
		data.forms_ctr = $('<div class="reform-forms-ctr" />').appendTo($this);
		data.ctrls_ctr = $('<div class="reform-ctrls-ctr" />').appendTo($this);

		// Move the template into the the main container.
		// data.forms_ctr.append(existing.remove());
		var ii = 0;
		existing.remove().each(function() {
		    data.forms_ctr.append(convert_form($this, $(this), ii++, true));
		});

		// Create new addition and removal buttons.
		data.add_btn = $('<a class="reform-add-btn" href="#">Add</a>');
		data.ctrls_ctr.append(data.add_btn);

		// Connect up the buttons.
		data.add_btn.click(function() {
		    methods.add.call($this);
		    return false;
		});
	    });
	},

	///
	/// Finalise the plugin.
	///
	destroy: function() {
	    return this.each(function() {
		var $this = $(this);
		var data = $this.data('reform');
		$(window).unbind('.reform');
		data.reform.remove();
		$this.removeData('reform');
	    });
	},

	///
	/// Add a new form.
	///
	add: function() {
	    return this.each(function() {
		var $this = $(this);
		var data = $this.data('reform');

		// Deep clone the template, putting the new form in it's own
		// containers.
		var idx = parseInt(data.total.val());
		var form_ctr = convert_form($this, data.template.clone(true), idx);
		data.forms_ctr.append(form_ctr.show());

		// Reindex.
		reindex_form_container(form_ctr, data.initial_count, data.total.val());

		// Increment the total number of forms.
		data.total.val(idx + 1);
	    });
	},

	///
	/// Remove form at index.
	///
	remove: function(index) {
	    return this.each(function() {
		var $this = $(this);
		var data = $this.data('reform');

		// Hunt down the form container and also all the following siblings.
		var form_ctr = $this.find('#reform-form-ctr-' + index);
		var siblings = form_ctr.nextAll();

		// Remove the container.
		form_ctr.remove();

		// Rename all following form containers and elements to
		// shuffle down their index.
		var ii = parseInt(index);
		siblings.each(function() {
		    reindex_form_container($(this), ii + 1, ii);
		    ++ii;
		});

		// Decrement the total number of forms.
		data.total.val(parseInt(data.total.val()) - 1);
	    });
	}
    }

    ///
    /// Method dispatch.
    ///
    $.fn.reform = function(method) {
	if(methods[method]) {
	    return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
	}
	else if(typeof method === 'object' || !method) {
	    return methods.init.apply(this, arguments);
	}
	else {
	    $.error('Method ' + method + 'does not exist on jQuery.reform');
	}
    }
})(jQuery);
