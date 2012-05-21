from django.http import Http404, HttpResponse
from django.utils import simplejson


__all__ = ['ac_path']


def ac_path(request):
    if request.method != 'GET' or 'q' not in request.GET:
        raise Http404
    qs = request.user.owned_nodes.filter(name__icontains=request.GET['q'])[:8]
    response = [{'name': n.path(), 'pk': n.pk} for n in qs]
    return HttpResponse(simplejson.dumps(response), mimetype='application/javascript')
