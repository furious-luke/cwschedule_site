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


__all__ = ['manage', 'create_node', 'node_children']


@login_required
def manage(request):
    return object_list(
        request,
        request.user.owned_nodes.filter(
            Q(parents__isnull=True) | Q(kind='P')
        ).order_by('kind', '-created'),
        template_name='cwschedule/manage.html',
        template_object_name='node',
        extra_context={
            'create_node_form': CreateNodeForm(),
            'active': get_active(request.user),
        },
    )


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

        response = {'status': 'success'}
    else:
        response = {
            'status': 'error',
            'form_errors': form.errors,
        }
    return HttpResponse(simplejson.dumps(response), mimetype='application/javascript')


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
