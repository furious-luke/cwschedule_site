(function($) {

    var methods = {

        ///
        /// Initialise the plugin.
        ///
        init : function(options) {
            return this.each(function() {
                var $this = $(this);

                // Prepare plugin data if not already done.
                var data = $this.data('tree');
                if(!data) {
                    $this.data('tree', $.extend({
                        flat_tree: '.flat-tree',
                        root_nodes: '.node[pa=""]',
                        expand_all: false,
                        navigation: true
                    }, options));
                    data = $this.data('tree');
                } else {
                    $.extend(data, options);
                }

                // If we weren't given a flat tree selector, try and make one.
                if (data.flat_tree == undefined) {
                    var id = $this.attr('id');
                    if(id)
                        data.flat_tree = '#' + id + '-flat';
                    else
                        data.flat_tree = '#tree-flat';
                }
            });
        },

        ///
        /// Finalise the plugin.
        ///
        destroy : function() {
            return this.each(function() {
                var $this = $(this);
                var data = $this.data('tree');
                $(window).unbind('.tree');
                data.tree.remove();
                $this.removeData('tree');
            });
        },

        ///
        /// Grow the tree from the flat description.
        ///
        grow : function(flat_tree, root_nodes) {
            return this.each(function() {
                var $this = $(this);
                var data = $this.data('tree');
                
                // Clear out anything currently in the tree.
                $this.html('');

                // Find the flat tree.
                if(flat_tree == undefined)
                    flat_tree = data.flat_tree;
                if(typeof(flat_tree) == 'string')
                    flat_tree = $(flat_tree);
                
                // Insert the root node.
                data.root = $('<div class="node root"><div class="children"></div></div>');
                $this.append(data.root);
                
                // Find the root nodes for the flat tree.
                if(root_nodes == undefined)
                    root_nodes = data.root_nodes;
                if(typeof(root_nodes) == 'string')
                    root_nodes = flat_tree.find(root_nodes);
                
                // Insert each node.
                root_nodes.each(function() {
                    methods.grow_node.call($this, $(this), data.root);
                });
                
                // If requested, setup navigation.
                if(data.navigation) {
                    methods.children.call($this, data.root).each(function() {
                        methods.setup_navigation.call($this, $(this));
                    });
                }
            });
        },

        ///
        /// Extract the parents or children pks from nodes.
        ///
        relationship_pks: function(node, rel) {
            var array = node.attr(rel);
            if(array == undefined)
                return new Array();

            array = array.split(' ');
            if(array.length > 0) {
                if(array[0] == '')
                    return new Array();
            }

            return array;
        },

        ///
        /// Extract children pks from node.
        ///
        children_pks: function(node) {
            return methods.relationship_pks.call(this, node, 'ch');
        },

        ///
        /// Extract parent pks from node.
        ///
        parent_pks: function(node) {
            return methods.relationship_pks.call(this, node, 'pa');
        },
        
        ///
        ///
        ///
        prepend_relationship_pk: function(node, pk, rel) {
            var pks = methods.relationship_pks.call(this, node, rel);
            var idx = pks.indexOf(pk);
            if(idx == -1) {
                pks.unshift(pk);
                node.attr(rel, pks.join(' '));
            }
        },
        
        ///
        ///
        ///
        prepend_child_pk: function(node, pk) {
            methods.prepend_relationship_pk.call(this, node, pk, 'ch');
        },
        
        ///
        ///
        ///
        prepend_parent_pk: function(node, pk) {
            methods.prepend_relationship_pk.call(this, node, pk, 'pa');
        },

        ///
        ///
        ///
        remove_relationship_pk: function(node, pk, rel) {
            var pks = methods.relationship_pks.call(this, node, rel);
            var idx = pks.indexOf(pk);
            if(idx != -1) {
                pks.splice(idx, 1);
                node.attr(rel, pks.join(' '));
            }
        },
        
        ///
        ///
        ///
        remove_child_pk: function(node, pk) {
            methods.remove_relationship_pk.call(this, node, pk, 'ch');
        },
        
        ///
        ///
        ///
        remove_parent_pk: function(node, pk) {
            methods.remove_relationship_pk.call(this, node, pk, 'pa');
        },

        ///
        /// Find the flat-tree entries for a node.
        ///
        flat_relationships: function(node, rel) {
            var array = methods.relationship_pks.call(this, node, rel);
            for(var ii = 0; ii < array.length; ++ii)
                array[ii] = '.node[pk="' + array[ii] + '"]:first';
            return $(this.data('tree').flat_tree).find(array.join(', '));
        },

        ///
        /// Extract children for node from the flat-tree.
        ///
        flat_children: function(node) {
            return methods.flat_relationships.call(this, node, 'ch');
        },

        ///
        /// Extract parents for node from the flat-tree.
        ///
        flat_parents: function(node) {
            return methods.flat_relationships.call(this, node, 'pa');
        },
        
        ///
        ///
        ///
        find_nodes: function(pks) {
            if(typeof(pks) == 'string')
                pks = [pks]
            for(var ii = 0; ii < pks.length; ++ii)
                pks[ii] = '.node[pk="' + pks[ii] + '"]';
            return this.find(pks.join(', '));
        },

        ///
        ///
        ///
        root_nodes: function() {
            var tree = this;

            return tree.find('.root > .children > .node');
        },
        
        ///
        ///
        ///
        children: function(node, pk) {
            var sel = '> .node';
            if(pk != undefined)
                sel += '[pk="' + pk + '"]';
            return methods.children_container.call(this, node).find(sel);
        },

        ///
        ///
        ///
        nodes_with_child: function(pk) {
            return $(this).find('.node[ch~="' + pk + '"]');
        },

        ///
        ///
        ///
        has_parent: function(node) {
            var pa = node.attr('pa');
            return !(pa == '' || pa == undefined);
        },
        
        ///
        ///
        ///
        has_child: function(node) {
            var ch = node.attr('ch');
            return (ch != '' && ch != undefined) || methods.children.call(this, node).length > 0;
        },
        
        ///
        ///
        ///
        children_container: function(node) {
            return node.find('> .children:first');
        },
        
        ///
        ///
        ///
        expand_control: function(node) {
            return node.find('> .container .expand:first');
        },
        
        ///
        ///
        ///
        collapse_control: function(node) {
            return node.find('> .container .collapse:first');
        },
        
        ///
        ///
        ///
        update_navigation: function(node) {
            var tree = this;
            
            // Setup visibility of expand and collapse.
            var expand_ctrl = methods.expand_control.call(tree, node);
            var collapse_ctrl = methods.collapse_control.call(tree, node);
            var has_children = methods.has_child.call(tree, node);
            var state = methods.children_container.call(tree, node).css('display');
            if(state == 'none')
                state = false;
            else
                state = true;
            expand_ctrl.toggle(has_children && !state);
            collapse_ctrl.toggle(state);
        },
        
        ///
        ///
        ///
        setup_navigation: function(node) {
            var tree = this;
            
            // Setup control visibility.
            methods.update_navigation.call(tree, node);
            
            // Prepare click functions.
            var expand_ctrl = methods.expand_control.call(tree, node);
            var collapse_ctrl = methods.collapse_control.call(tree, node);
            expand_ctrl.click(function() {
                methods.toggle_children.call(tree, node);
            });
            collapse_ctrl.click(function() {
                methods.toggle_children.call(tree, node);
            });
        },
        
        ///
        ///
        ///
        grow_node: function(node, loc_node) {
            var tree = this;
            var data = tree.data('tree');
            
            var child_ctr = methods.children_container.call(tree, loc_node);
            var new_node = node.clone();
            child_ctr.append(new_node);
            var children = methods.flat_children.call(tree, node);
            children.each(function() {
                methods.grow_node.call(tree, $(this), new_node);
            });
            
            // Trigger the node ready event.
            tree.trigger('node_ready', [tree, new_node]);
            
            // Show the children if expand_all is set, but only if this is not
            // the root node.
            if(!loc_node.hasClass('root'))
                child_ctr.toggle(data.expand_all);
        },

        ///
        ///
        ///
        expand_all: function() {
            var tree = this;

            function callback(node) {
                methods.children.call(tree, node).each(function() {
                    if(methods.has_child.call(tree, $(this)))
                        methods.toggle_children.call(tree, $(this), true, callback);
                });
            }

            methods.root_nodes.call(tree).each(function() {
                if(methods.has_child.call(tree, $(this)))
                    methods.toggle_children.call(tree, $(this), true, callback);
            });
        },

        ///
        ///
        ///
        collapse_all: function() {
            var tree = this;

            tree.find('> .root > .children .node').each(function() {
                methods.toggle_children.call(tree, $(this), false);
            });
        },
        
        ///
        ///
        ///
        toggle_children: function(node, state, callback) {
            var child_ctr = methods.children_container.call(this, node);
            var children = methods.children_pks.call(this, node);

            // In checking for children, I check both for potential children (those unloaded)
            // and actual children (those currently instanced).
            var has_children = children.length > 0 || child_ctr.find('> .node:first').length > 0;
            
            // Toggle the visibility of the child container no matter what.
            child_ctr.toggle(state);

            // Set button visibility based on whether there are any children at all.
            methods.update_navigation.call(this, node);

            // Load the children if there are any to load.
            if(children.length > 0 && !methods.children_loaded.call(this, node))
                methods.load_children.call(this, node, callback);
            else if(callback)
                callback.call(this, node);
        },
        
        ///
        ///
        ///
        children_loaded: function(node) {
            return node.attr('loaded') != undefined;
        },
        
        ///
        ///
        ///
        load_children: function(node, callback) {
            var tree = this;
            var data = this.data('tree');
            
            // Put a waiting thingy in the container.
            var child_ctr = methods.children_container.call(tree, node);
            var waiting = $('img.waiting:hidden').clone();
            child_ctr.append(waiting);
            waiting.show();

            pk = node.attr('pk');
            child_ctr.load(
                '/node/' + pk + '/children/',
                function(response, status) {
                    waiting.remove();
                    if(status == 'success') {
                        
                        // Flag this node as loaded.
                        node.attr('loaded', 'true');

                        // Setup the navigation for each child node.
                        if(data.navigation) {
                            child_ctr.children('.node').each(function() {
                                methods.setup_navigation.call(tree, $(this));
                            });
                        }
                        
                        // Trigger the node ready event for each node.
                        child_ctr.children('.node').each(function() {
                            tree.trigger('node_ready', [tree, $(this)]);
                        });

                        // Call the callback.
                        if(callback)
                            callback.call(tree, node);// child_ctr.children('.node'));
                    }
                    else {
                        alert('Server error.');
                    }
                }
            );
        },
        
        ///
        ///
        ///
        prepend_node: function(node, callback) {
            var tree = this;
            var data = tree.data('tree');

            // First off, find all existing instances of the node we just loaded
            // and replace them with the new node.
            tree.find('.node[pk="' + node.attr('pk') + '"]').each(function() {
                $(this).attr('ch', node.attr('ch'));
                $(this).attr('pa', node.attr('pa'));
            });

            // Find all parent instances.
            var parents = methods.find_nodes.call(tree, methods.parent_pks.call(tree, node));

            // If there are any existing parents check if the node also exists on the root.
            // We do this because we may need to remove the node from the root.
            if(parents.length) {

                // Remove any root instances.
                methods.children.call(tree, tree.find('.root'), node.attr('pk')).remove();
            }

            // If 'parents' is empty insert the node into the root.
            else
                parents = tree.find('.node.root:first');

            // Insert a clone of the node into each one.
            parents.each(function() {
                var parent = $(this);

                // Make sure the parent has this child, so long as the parent is not the root.
                if(!parent.hasClass('root'))
                    methods.prepend_child_pk.call(tree, parent, node.attr('pk'));

                // Check that this parent does not already contain the child.
                if(!methods.children.call(tree, parent, node.attr('pk')).length) {

                    // Insert the node and update parent navigation.
                    var new_node = node.clone(true);
                    methods.children_container.call(tree, parent).prepend(new_node);
                    methods.prepend_child_pk.call(tree, parent, new_node.attr('pk'));
                    methods.update_navigation.call(tree, parent);

                    // Setup the navigation.
                    if(data.navigation)
                        methods.setup_navigation.call(tree, new_node);

                    // Trigger the node ready event.
                    tree.trigger('node_ready', [tree, new_node]);

                    // Call the callback.
                    if(callback)
                        callback(tree, node);
                }
            });
        },
        
        ///
        ///
        ///
        load_node: function(pk, callback) {
            var tree = this;
            var data = tree.data('tree');

            // Load the node from the server, initially into a hidden
            // container.
            loaded_node = $('<div style="display:none"></div>')
            loaded_node.load(
                '/node/' + pk + '/',
                function(response, status) {
                    // waiting.remove();
                    // node_placeholder.remove();
                    if(status == 'success') {

                        // Pull out the loaded node and insert it.
                        loaded_node = loaded_node.children();
                        methods.prepend_node.call(tree, loaded_node);
                    }
                    else {
                        alert('Server error.');
                    }
                }
            );
        },

        ///
        /// Update a node after modification.
        ///
        /// Notes: The entire branch of the node that was edited is removed.
        ///        I do this because it is unknown how the editing of the node
        ///        could affect its children.
        ///
        update_node: function(pk, callback) {
            var tree = this;
            var data = tree.data('tree');

            // Remove all content from existing instances and replace with a waiting
            // circle.
            tree.find('.node[pk="' + pk + '"]').each(function() {
                $(this).find('> .container > .center').html('').addClass('waiting');
            });

            // Load the node from the server.
            loaded_node = $('<div style="display:none"></div>')
            loaded_node.load(
                '/node/' + pk + '/',
                function(response, status) {

                    // Clear out the waiting things.
                    tree.find('.node[pk="' + pk + '"]').each(function() {
                        $(this).find('> .container > .center').html('').removeClass('waiting');
                    });

                    if(status == 'success') {

                        // Pull out the loaded node and insert it.
                        loaded_node = loaded_node.children();
                        tree.find('.node[pk="' + pk + '"]').each(function() {

                            // Actually replace the node.
                            // TODO: This causes the loss of branch states; will need to
                            // store the current branch state and see if we can bring it back.
                            var tmp = loaded_node.clone();
                            $(this).replaceWith(tmp);
                            // $(this).find('> .container > .center').html(
                            //     loaded_node.find('> .container > .center').clone()
                            // );

                            // Setup the navigation.
                            if(data.navigation)
                                methods.setup_navigation.call(tree, tmp);

                            // Trigger node update.
                            tree.trigger('node_ready', [tree, tmp]);
                        });
                    }
                    else {
                        alert('Server error.');
                    }
                }
            );
        },

        ///
        ///
        ///
        is_root_node: function(node) {
            return $(this).find('.root > .children > .node[pk="' + node.attr('pk') + '"]').length > 0;
        },

        ///
        ///
        ///
        delete_node: function(node, all) {
            var tree = this;
            var data = tree.data('tree');
            var pk = node.attr('pk');
            if(all == undefined)
                all = true;

            // Define a function for deleting one node.
            function delete_one(node) {

                // Get the parent.
                var parent = node.parent().closest('.node');

                // Remove the node pk from its parent.
                methods.remove_child_pk.call(tree, parent, pk);

                // Process each child.
                methods.children.call(tree, node).each(function() {
                    var child = $(this);

                    // Remove the parent pk.
                    methods.remove_parent_pk.call(tree, child, pk);

                    // If there are no parents left and this child does not already exist
                    // at the root, move it.
                    if(!methods.has_parent.call(tree, child) && !methods.is_root_node.call(tree, child))
                        tree.find('.root > .children').prepend(child);
                });

                // Now remove the node.
                node.remove();

                // If there is nothing left in the parent, close it.
                if(!methods.children_container.call(tree, parent).children().length)
                    methods.toggle_children.call(tree, parent, false);

                // Update navigation on parent.
                methods.update_navigation.call(tree, parent);
            }

            // Are we deleteing all or one?
            if(all) {

                // ASSUMPTION: All node instances must be loaded.

                // Locate all instances of the node and delete them.
                tree.find('.node[pk="' + pk + '"]').each(function() {
                    delete_one($(this));
                });
            }

            // Just one.
            else
                delete_one(node);
        },

        ///
        ///
        ///
        unlink_node: function(node) {
            var tree = this;
            var data = tree.data('tree');
            var pk = node.attr('pk');

            // Get the parent.
            var parent = node.parent().closest('.node');

            // Remove the node pk from its parent and the parent pk from
            // all instances of the node.
            methods.remove_child_pk.call(tree, parent, pk);
            tree.find('.node[pk="' + pk + '"]').each(function() {
                methods.remove_parent_pk.call(tree, $(this), parent.attr('pk'));
            });

            // If there are no parents left and this child does not already exist
            // at the root, move it.
            if(!methods.has_parent.call(tree, node) && !methods.is_root_node.call(tree, node))
                tree.find('.root > .children').prepend(node);

            // If it already exists elsewhere, delete this one.
            else
                node.remove();

            // If there is nothing left in the parent, close it.
            if(!methods.children_container.call(tree, parent).children().length)
                methods.toggle_children.call(tree, parent, false);

            // Update navigation on parent.
            methods.update_navigation.call(tree, parent);
        }
    }

    ///
    /// Method dispatch.
    ///
    $.fn.tree = function(method) {
        if (methods[method]) {
            return methods[method].apply(this, Array.prototype.slice.call(
                    arguments, 1));
        } else if (typeof method === 'object' || !method) {
            return methods.init.apply(this, arguments);
        } else {
            $.error('Method ' + method + 'does not exist on jQuery.tree');
        }
    }
    
})(jQuery);
