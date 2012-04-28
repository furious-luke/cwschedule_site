(function($){

    var methods = {

 	///
	/// Initialise the plugin.
	///
	init: function(options) {
	    return this.each(function() {
		var $this = $(this);

		// Prepare plugin data if not already done.
		var data = $this.data('attr_stack');
		if(!data) {
		    $this.data('attr_stack', $.extend({
		    }, options));
		    data = $this.data('attr_stack');
		}
	    });
	},

	///
	/// Finalise the plugin.
	///
	destroy: function() {
	    return this.each(function() {
		var $this = $(this);
		var data = $this.data('attr_stack');
		$(window).unbind('.attr_stack');
		data.attr_stack.remove();
		$this.removeData('attr_stack');
	    });
	},

	///
	/// Push an attribute onto the stack.
	///
	push: function(attrs) {
	    return this.each(function() {
		var $this = $(this);
		var data = $this.data('attr_stack');
		if(!data) {
		    methods.init.call($this)
		    data = $this.data('attr_stack');
		}
		if(typeof attrs === 'string')
		    attrs = [attrs];
		for(var ii = 0; ii < attrs.length; ++ii) {
		    var attr = attrs[ii];
		    var cur = data[attr];
		    var val = $this.attr(attr);
		    if(val != undefined) {
			if(cur != undefined)
			    cur.push(val);
			else
			    data[attr] = Array(val);
		    }
		}
	    });
	},

	///
	/// Pop an attribute off the stack.
	///
	pop: function(attrs) {
	    return this.each(function() {
		var $this = $(this);
		var data = $this.data('attr_stack');
		if(!data) {
		    methods.init.call($this)
		    data = $this.data('attr_stack');
		}
		if(typeof attrs === 'string')
		    attrs = [attrs];
		for(var ii = 0; ii < attrs.length; ++ii) {
		    var attr = attrs[ii];
		    var cur = data[attr];
		    if(cur != undefined) {
			$this.attr(attr, cur.pop());
			if(!cur.length)
			    delete data[attr];
		    }
		    else
			$this.removeAttr(attr);
		}
	    });
	}
    }

    ///
    /// Method dispatch.
    ///
    $.fn.attr_stack = function(method) {
	if(methods[method]) {
	    return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
	}
	else if(typeof method === 'object' || !method) {
	    return methods.init.apply(this, arguments);
	}
	else {
	    $.error('Method ' + method + 'does not exist on jQuery.attr_stack');
	}
    }
})(jQuery);
