(function($){
    var all_inputs_selector = 'input, hidden, password, radio, checkbox, textarea, button, submit';

    var methods = {

 	///
	/// Initialise the plugin.
	///
	init: function(options) {
	    return this.each(function() {
		var $this = $(this);

		// Prepare plugin data if not already done.
		var data = $this.data('ajax_form');
		if(!data) {
		    $this.data('ajax_form', $.extend({
			url: undefined,
			data_type: 'json',
			ctrls: undefined,
			waiting: $this.find('.waiting'),
			success: undefined,
			form_error: undefined,
			error: undefined,
			popup_width: 100,
			popup_position: 'tr'
		    }, options));
		    data = $this.data('ajax_form');
		}

		// // Store the initial values for each element. We need these to
		// // determine if anything has changed on a tab.
		// $this.find('input[type!="checkbox"], textarea, select').map(function(){
		//     $(this).attr('initial', $(this).val());
		// });
		// $this.find('input[type="checkbox"]').map(function(){
		//     $(this).attr('initial', $(this).attr('checked'));
		// });

		// Convert the form to an ajax form.
		$this.ajaxForm({
		    url: data.url,
		    dataType: data.data_type,
		    beforeSubmit: function(form_data, form) {

			// If there are any error prompts open, shut them down.
			methods.hide_form_errors.call($this);

			// Show the waiting gif.
			data.waiting.show();

			// Disable any controls that can't be used during submition.
			var ctrls = $this.find(all_inputs_selector);
			if(data.ctrls)
			    ctrls = ctrls.add(data.ctrls);
			ctrls.attr_stack('push', ['disabled', 'class']).attr('disabled', 'disabled').addClass('ui-state-disabled');
    		    },
    		    success: function(response) {

			// Hide the waiting gif.
			data.waiting.hide();

			// Re-enable any controls that were disabled.
			var ctrls = $this.find(all_inputs_selector);
			if(data.ctrls)
			    ctrls = ctrls.add(data.ctrls);
			ctrls.attr_stack('pop', ['disabled', 'class']);

			// Process success or failure, calling callbacks if available.
    			if(response.status == 'success') {

			    // // Display a success message.
			    // show_form_success($this);

			    if(data.success)
				data.success.call(this, response);
			}
    			else {

			    // I put the errors on the element so I can repeatedly call
			    // show form errors later.
			    data.form_errors = response.form_errors;
			    methods.show_form_errors.call($this);

			    // Call error routine.
			    if(data.form_error)
				data.form_error.call(this, data.form_errors);
			}
		    },
    		    error: function() {

			// Hide the waiting gif.
			data.waiting.hide();

			// Re-enable any controls that were disabled.
			var ctrls = $this.find(all_inputs_selector);
			if(data.ctrls)
			    ctrls = ctrls.add(data.ctrls);
			ctrls.attr_stack('pop', ['disabled', 'class']);

			// Call error routine.
			if(data.error)
			    data.error.call(this, response);

			// Put up a server error.
			alert('Server error.');
    		    }
		});
	    });
	},

	///
	/// Finalise the plugin.
	///
	destroy: function() {
	    return this.each(function() {
		var $this = $(this);
		var data = $this.data('ajax_form');
		$(window).unbind('.ajax_form');
		data.ajax_form.remove();
		$this.removeData('ajax_form');
	    });
	},

	///
	/// Reset the form.
	///
	reset: function() {
	    return this.each(function() {
		var $this = $(this);

		// Call the form reset.
		$this.reset();

		// If there are any error prompts open, shut them down.
		$('.formError').remove();

		// $this.find('input[type!="checkbox"], textarea, select').map(function() {
		//     $(this).val($(this).attr('initial'));
		// });
		// $this.find('input[type="checkbox"]').map(function() {
		//     $(this).attr('checked', $(this).attr('initial'));
		// });
	    });
	},

	///
	/// Show a popup around an element in the form.
	///
	popup: function(input_name, message) {
	    return this.each(function() {
		var $this = $(this);
		var data = $this.data('ajax_form');

		// Find the element and grab some details.
		var elem = $this.find('#id_' + input_name).first();
		if(elem.length) {
		    var elem_pos = elem.position();
		    var elem_width = elem.outerWidth();
		    var elem_height = elem.outerHeight();

		    // Create a container to hold the popup. Need this for
		    // the relative positioning.
		    var ctr = $('<div id="' + input_name + '-popup" />');
		    ctr.addClass('ajax-form-popup');
		    ctr.css({
			'display': 'inline-block',
			'position': 'relative'
		    });
		    elem.before(ctr);
		    var ctr_pos = ctr.position();

		    // Create the popup with no visibility and insert it into the DOM
		    // in order to calculate the height. Don't forget to add the
		    // class here!
		    var popup = $('<div />').html(message);
		    popup.width(data.popup_width).addClass('ajax-form-error').css({
			'position': 'absolute',
			'visibility': 'hidden'
		    });
		    ctr.append(popup);
		    var popup_height = popup.outerHeight();

		    // Calculate the positions.
		    var top = elem_pos.top - ctr_pos.top;
		    if(data.popup_position[0] == 't')
			top -= popup_height + 5;
		    else if(data.popup_position[0] == 'b')
			top += elem_height;
		    var left = elem_pos.left - ctr_pos.left;
		    if(data.popup_position[1] == 'l')
			left -= data.popup_width;
		    else if(data.popup_position[1] == 'r')
			left += elem_width - elem_width/4;
		    else
			left += (elem_width - data.popup_width)/2;

		    // Add an arrow.
                    var arrow = $('<div>').addClass('ajax-form-arrow');
                    arrow.html('<div class="line10"><!-- --></div><div class="line9"><!-- --></div><div class="line8"><!-- --></div><div class="line7"><!-- --></div><div class="line6"><!-- --></div><div class="line5"><!-- --></div><div class="line4"><!-- --></div><div class="line3"><!-- --></div><div class="line2"><!-- --></div><div class="line1"><!-- --></div>');

		    // Now prepare the absolute positioning and show it.
		    popup.css({
			'top': top,
			'left': left,
			'z-index': 5000,
			'visibility': 'visible'
		    });
		    arrow.css({
			'position': 'absolute',
			'top': top + popup_height,
			'left': left
		    });

		    // Add the popup and the arrow to the container and fade in.
		    ctr.append(popup).append(arrow);;
		    ctr.append(arrow);
		    popup.add(arrow).fadeIn(150);

		    // Clicks will close the error.
		    popup.click(function() {
			popup.add(arrow).fadeOut(150, function() {
			    ctr.remove();
			});
		    });
		}
	    });
	},

	///
	/// Show a popup around an element in the form.
	///
	show_form_errors: function() {
	    return this.each(function() {
		var $this = $(this);
		var data = $this.data('ajax_form');

		for(var key in data.form_errors) {
		    if(data.form_errors.hasOwnProperty(key)) {

			// Don't show the error if the input in question is
			// not visible, or if we already have a popup.
			if(!$this.find('#id_' + key + ':visible').length || $this.find('#' + key + '-popup').length)
			    continue;

			// Compute an error message from the keys.
			var msg;
			if(data.form_errors[key].length > 1) {
			    msg = '<ul style="margin:0;padding-left:20px">';
			    for(var ii = 0; ii < data.form_errors[key].length; ++ii) {
				msg += '<li>' + data.form_errors[key][ii] + '</li>';
			    }
			    msg += '</ul>';
			}
			else
			    msg = data.form_errors[key][0];

			// Show popup.
			methods.popup.call($this, key, msg);
		    }
		}
	    });
	},

	///
	/// Hide all form errors.
	///
	hide_form_errors: function() {
	    return this.each(function() {
		var $this = $(this);
		$this.find('.ajax-form-popup').remove();
	    });
	},

	///
	/// Return the first DOM element with an error.
	///
	first_form_error: function(callback) {
	    return this.each(function() {
		var $this = $(this);
		var data = $this.data('ajax_form');
		if(data.form_errors) {
		    for(var key in data.form_errors) {
			if(data.form_errors.hasOwnProperty(key)) {
			    var input = $this.find('#id_' + key);
			    callback(input);
			    break;
			}
		    }
		}
		else
		    return $();
	    });
	}
    }

    ///
    /// Method dispatch.
    ///
    $.fn.ajax_form = function(method) {
	if(methods[method]) {
	    return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
	}
	else if(typeof method === 'object' || !method) {
	    return methods.init.apply(this, arguments);
	}
	else {
	    $.error('Method ' + method + 'does not exist on jQuery.ajax_form');
	}
    }
})(jQuery);
