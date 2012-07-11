import datetime

from django.http import Http404, HttpResponse
from django.shortcuts import render, get_object_or_404, redirect
from django.views.generic.list_detail import object_list
from django.utils import simplejson
from django.contrib.auth.decorators import login_required

from cwschedule.models import *
from cwschedule.forms import *

from .helpers import *


__all__ = ['manage']


@login_required
def manage(request):
    return object_list(
        request,
        request.user.owned_nodes.all().order_by('kind', '-created'),
        template_name='cwschedule/manage.html',
        template_object_name='node',
        extra_context={
            'create_node_form': CreateNodeForm(),
            'link_node_form': LinkNodeForm(),
            'active': get_active(request.user),
        },
    )
