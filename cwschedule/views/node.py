import datetime

from django.db.models import Q
from django.http import Http404, HttpResponse
from django.shortcuts import render, get_object_or_404, redirect
from django.views.generic.list_detail import object_list
from django.utils import simplejson
from django.contrib.auth.decorators import login_required

from cwschedule.models import *
from cwschedule.forms import *

from .helpers import *


__all__ = ['create_node', 'link_node', 'delete_node', 'unlink_node', 'update_node',
           'node_children', 'node', 'node_details']


@login_required
def create_node(request, parent=None):
    if request.method != 'POST':
        raise Http404
    if parent is not None:
        parent = get_object_or_404(Node, pk=parent, owner=request.user)

    form = CreateNodeForm(data=request.POST)
    if form.is_valid():

        # Assume the parent's 'site_related' attribute.
        if parent is not None:
            site_related = parent.site_related
        else:
            site_related = False

        # Create the node.
        node = Node.objects.create(
            name=form.cleaned_data['name'],
            site_related=site_related,
            owner=request.user,
            )
        node.save()

        # Add to the parent.
        if parent is not None:
            parent.dependencies.add(node)

        response = {
            'status': 'success',
            'pk': node.pk,
        }
    else:
        response = {
            'status': 'error',
            'form_errors': form.errors,
        }
    return HttpResponse(simplejson.dumps(response), mimetype='application/javascript')


@login_required
def link_node(request, parent):
    if request.method != 'POST':
        raise Http404
    parent = get_object_or_404(Node, pk=parent, owner=request.user)
    form = LinkNodeForm(data=request.POST, parent=parent)
    if form.is_valid():
        node = form.cleaned_data['node']
        parent.dependencies.add(node)
        response = {
            'status': 'success',
            'pk': node.pk,
        }
    else:
        response = {
            'status': 'error',
            'form_errors': form.errors,
        }
    return HttpResponse(simplejson.dumps(response), mimetype='application/javascript')


@login_required
def delete_node(request, pk):
    if request.method != 'POST':
        raise Http404
    node = get_object_or_404(Node, pk=pk, owner=request.user)
    node.delete();
    response = {'status': 'success'}
    return HttpResponse(simplejson.dumps(response), mimetype='application/javascript')


@login_required
def unlink_node(request, pk, parent_pk):
    if request.method != 'POST':
        raise Http404
    node = get_object_or_404(Node, pk=pk, owner=request.user)
    parent = get_object_or_404(Node, pk=parent_pk, owner=request.user)
    if not parent.dependencies.filter(pk=pk, owner=request.user).exists():
        raise Http404
    parent.dependencies.remove(node)
    parent.save()
    response = {'status': 'success'}
    return HttpResponse(simplejson.dumps(response), mimetype='application/javascript')


@login_required
def update_node(request, pk):
    if request.method != 'POST':
        raise Http404
    node = get_object_or_404(Node, pk=pk, owner=request.user)

    update_form = NodeDetailsForm(request.POST, instance=node, is_staff=request.user.is_staff)

    # I need to forcefully insert values for node and user.
    post = {}
    for k, v in request.POST.iteritems():
        if k[-5:] == '-user' and not v:
            post[k] = unicode(request.user.pk)
        elif k[-5:] == '-node' and not v:
            post[k] = unicode(node.pk)
        else:
            post[k] = v

    # Setup the repeating formset.
    repeating_formset = RepeatingFormSet(
        post,
        queryset=node.repeating.filter(user=request.user),
    )

    # Both the update form and the repeating formset must be valid.
    if update_form.is_valid() and repeating_formset.is_valid():

        # Need extra checks for repeating user and node.
        for cleaned_data in repeating_formset.cleaned_data:
            if cleaned_data['user'] != request.user or \
                    cleaned_data['node'].owner != request.user:
                raise Http404

        # Save the node.
        update_form.save();

        # Save the repeating formset.
        repeating_formset.save()

        response = {
            'status': 'success',
        }
    else:
        form_errors = update_form.errors
        form_errors.update(process_formset_errors(repeating_formset.errors))
        response = {
            'status': 'error',
            'form_errors': form_errors,
        }
    return HttpResponse(simplejson.dumps(response), mimetype='application/javascript')


@login_required
def node(request, pk):
    if request.method != 'GET':
        raise Http404
    node = get_object_or_404(Node, pk=pk, owner=request.user)
    return render(request, 'cwschedule/node.html', locals())


@login_required
def node_details(request, pk):
    if request.method != 'GET':
        raise Http404
    try:
        node = get_object_or_404(Node, pk=pk, owner=request.user)
    except:
        node = get_object_or_404(Node, pk=pk, site_related=True)

    details_form = NodeDetailsForm(instance=node, is_staff=request.user.is_staff)
    repeating_formset = RepeatingFormSet(
        queryset=node.repeating.filter(user=request.user),
    )
    return render(request, 'cwschedule/details.html', locals())


@login_required
def node_children(request, pk):
    if request.method != 'GET':
        raise Http404
    node = get_object_or_404(Node, pk=pk, owner=request.user)
    ctx = {
        'node_list': node.dependencies.all(),
        'parent': node,
    }
    return render(request, 'cwschedule/node_list.html', ctx)
