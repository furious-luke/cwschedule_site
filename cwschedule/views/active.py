import datetime

from django.http import Http404, HttpResponse
from django.shortcuts import render, get_object_or_404, redirect
from django.utils import simplejson
from django.contrib.auth.decorators import login_required

from cwschedule.models import *


__all__ = ['activate', 'deactivate']


##
##
##
@login_required
def activate(request, pk):
    if request.method != 'POST':
        raise Http404
    node = get_object_or_404(Node, pk=pk, owner=request.user)
    today = datetime.date.today()
    try:
        work = node.work.get(date=today, user=request.user)
    except Work.DoesNotExist:
        work = Work.objects.create(date=today, user=request.user, node=node)

    try:
        active = Active.objects.get(work__user=request.user)
        active.deactivate()
        active.delete()
    except Active.DoesNotExist:
        pass
    active = Active.objects.create(work=work)

    response = {
        'state': 'success',
        'work': {
            'active_pk': active.pk,
            'node_pk': node.pk,
            'node_name': node.name,
        },
    }
    return HttpResponse(simplejson.dumps(response), mimetype='application/javascript')

##
##
##
@login_required
def deactivate(request, pk):
    if request.method != 'POST':
        raise Http404
    active = get_object_or_404(Active, pk=pk)
    if active.work.node.owner != request.user or active.work.user != request.user:
        raise Http404
    active.deactivate()
    active.delete()

    response = {'status': 'success'}
    return HttpResponse(simplejson.dumps(response), mimetype='application/javascript')
