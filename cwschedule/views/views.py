import datetime

from django.db.models import Q, Max, Sum
from django.http import Http404, HttpResponse
from django.template.loader import get_template
from django.template import RequestContext
from django.shortcuts import render, get_object_or_404, redirect
from django.views.generic.list_detail import object_list
from django.utils import simplejson
from django.contrib.auth.decorators import login_required
from django.utils.datastructures import SortedDict

from apps.todo.models import *
from apps.todo.forms import *


__all__ = ['manage',
           'blocking_queryset', 'add_dead_line_remaining_days', 'add_slack_remaining_days',
           'add_priority_term', 'add_remaining_term',
           'scheduler_blocking', 'scheduler_isolated', 'scheduler_critical_path',
           'feature_poll', 'feature_leaderboard',
           'ajax_new_node', 'ajax_add_node', 'ajax_load_node', 'ajax_load_node_details',
           'ajax_delete_node', 'ajax_unlink_node',
           'ajax_update_node', 'ajax_load_node_details', 'ajax_load_node_deps',
           'ajax_node_ac', 'ajax_feature_poll_submit',
           'ajax_start_tracking', 'ajax_stop_tracking']


def process_formset_errors(formset_errors):
    processed = {}
    ii = 0
    for form_errors in formset_errors:
        for k, v, in form_errors.iteritems():
            processed['form-%d-%s'%(ii, k)] = v
        ii += 1
    return processed


def get_active(user):
    try:
        return Active.objects.get(work__user=user)
    except Active.DoesNotExist:
        return None


def blocking_queryset(user):
    qs = user.owned_nodes.filter(completed=False).exclude(dependencies__completed=False)
    return qs


def add_dead_line_remaining_days(queryset, ctx):
    ctx['remaining_days'] = 'CASE WHEN dead_line IS NULL THEN 0.0 ELSE (EXTRACT(EPOCH FROM (dead_line - (NOW() + (CASE WHEN ongoing_estimate IS NULL THEN initial_estimate ELSE ongoing_estimate END) - accumulated)))/86400.0) END'
    return queryset.extra(select={'remaining_days': ctx['remaining_days']});


def add_slack_remaining_days(queryset, ctx):
    ctx['remaining_days'] = 'CASE WHEN slack IS NULL THEN 0.0 ELSE EXTRACT(EPOCH FROM slack)/86400.0 END'
    return queryset.extra(select={'remaining_days': ctx['remaining_days']});


def add_priority_term(queryset, ctx):
    ctx['priority_term'] = '(priority - %(p_min)f)/(2.0*%(p_range)f)'%ctx
    return queryset.extra(select={'priority_term': ctx['priority_term']})


def add_remaining_term(queryset, ctx):
    less_than_r0 = '%(r0)f/(2.0*(%(remaining_days)s)*%(p_range)f)'%ctx
    greater_than_r0 = '1.0/(2.0*%(p_range)f) + (%(p_range)f - 1.0)*(%(r0)f - (%(remaining_days)s))/(2.0*%(r_range)f*%(p_range)f)'%ctx
    new_ctx = {
        'ltr0': less_than_r0,
        'gtr0': greater_than_r0,
    }
    new_ctx.update(ctx)
    ctx['remaining_term'] = 'CASE WHEN %(remaining_switch)s IS NULL THEN 0.0 WHEN (%(remaining_days)s) > %(r0)f THEN (%(ltr0)s) ELSE (%(gtr0)s) END'%new_ctx
    return queryset.extra(select={'remaining_term': ctx['remaining_term']})

# def add_remaining_term(queryset, ctx):
#     less_than_r0 = '%(r0)f/(2.0*(%(remaining_days)s)*%(p_range)f)'%ctx
#     greater_than_r0 = '1.0/(2.0*%(p_range)f) + (%(p_range)f - 1.0)*(%(r0)f - (%(remaining_days)s))/(2.0*%(r_range)f*%(p_range)f)'%ctx
#     new_ctx = {
#         'ltr0': less_than_r0,
#         'gtr0': greater_than_r0,
#     }
#     new_ctx.update(ctx)
#     ctx['remaining_term'] = 'CASE WHEN %(dead_line_field)s IS NULL THEN 0.0 WHEN (%(remaining_days)s) > %(r0)f THEN (%(ltr0)s) ELSE (%(gtr0)s) END'%new_ctx
#     return queryset.extra(select={'remaining_term': ctx['remaining_term']})


##
## Brief.
##
## Need to order by blocking and then some combination of priority, dead-line
## and estimated time to completion. Let's think of some basic rules:
##
##   1. Tasks that can no longer be completed before
##      their dead-line get placed first.
##
##   2. Tasks are sorted according to priority, so long
##      as rule 1 is not broken.
##
##   4. Tasks closer to their deadline should be weighted
##      more favorably than those that are further away.
##
## We need a way of deciding how to equate the dead-line metric with priority.
## Perhaps, for now, we will say a maximum priority task has equivalent urgency
## as a task that is on its critical dead-line point.
##
##   r = remaining time until deadline
##     = d - (c + e - a)
##
## where d is the dead-line, c is the current time, e is the estimated time
## and a is the accumulated time.
##
##   U = f(p,r)
##     = f1(p) + f2(r)
##
##   f2(0) = f1(p_max)
##
## Say urgency ranges from 0.0 to 1.0, 0.0 being least urgent and 1.0 being
## most urgent.
##
##   f2(0) = f1(p_max) = 0.5
##
##   f1(p) = (p - p_min)/(2*(p_max - p_min))
##
## This makes f1 linear with p, which seems like a good gradient. Now, how
## about f2... an exponential seems nice, it has the property that no matter
## how far away the task dead-line is it will still have some minor ranking.
## Problem there is that the EXP postgresql function fails with large
## exponents. Instead, I will go with a piece-wise linear function.
##
##   f2(r) = r_0/(2*r*(p_max - p_min)),           if r > r0
##           1/(2*(p_max - p_min)) + m(r_0 - r),  if r <= r0
##
## Where r_0 is the remaining days before we begin to ramp up the urgency.
## Now, what should the gradient be? I think I'll parameterise it with
## respect to another value, r_1, which is how many days are remaining
## before the urgency is equal to that of a maximum priority task:
##
##   m = (p_max - p_min - 1)/(2*(r_0 - r_1)*(p_max - p_min)
##
## So, final urgency equation is:
##
##   U = (p - p_min)/(2*(p_max - p_min)) + 
##       r_0/(2*r*(p_max - p_min)),                                                             if r > r0
##       1/(2*(p_max - p_min)) + (p_max - p_min - 1)*(r_0 - r)/(2*(r_0 - r_1)*(p_max - p_min),  if r <= r0
##
## Note that this equation only considers each node in isolation from the rest.
##
def urgency_queryset(user, remaining_func, remaining_switch):
    ctx = {
        'p_min': 0,
        'p_max': 5,
        'p_range': 5,
        'r0': 14,
        'r1': 1,
        'r_range': 13,
        'remaining_switch': remaining_switch,
    }
    qs = blocking_queryset(user)
    qs = remaining_func(qs, ctx)
    qs = add_priority_term(qs, ctx)
    qs = add_remaining_term(qs, ctx)
    qs = qs.extra(select={'urgency': '%(priority_term)s + %(remaining_term)s'%ctx}, order_by=['-urgency']);
    return qs


# def bak_urgency_queryset(user, dead_line_field):
#     p_min = 0
#     p_max = 5
#     p_range = p_max - p_min
#     r0 = 14.0         # days
#     r1 = 1.0          # days
#     r_range = r0 - r1 # days

#     remaining_days = 'CASE WHEN %s IS NULL THEN 0.0 ELSE (EXTRACT(EPOCH FROM (%s - (NOW() + estimate - accumulated)))/86400.0) END'%(dead_line_field, dead_line_field)
#     priority_term = '(priority - %f)/%f'%(p_min, 2*p_range)
#     less_than_r0 = '%f/(2*%s*%f)'%(r0, remaining_days, p_range)
#     greater_than_r0 = '1.0/%f + %f*(%f - %s)/%f'%(2*p_range, p_range - 1, r0, remaining_days, 2.0*r_range*p_range)
#     remaining_term = 'CASE WHEN %s IS NULL THEN 0.0 WHEN (%s) > %f THEN (%s) ELSE (%s) END'%(dead_line_field, remaining_days, r0, less_than_r0, greater_than_r0)

#     qs = blocking_queryset(user).extra(
#         select=SortedDict([
#             ('remaining_days', remaining_days),
#             ('priority_term', priority_term),
#             ('remaining_term', remaining_term),
#             ('urgency', ' + '.join([priority_term, remaining_term])),
#         ]),
#         order_by=['-urgency'],
#     )

#     return qs


def isolated_queryset(user):
    return urgency_queryset(user, add_dead_line_remaining_days, 'dead_line')


def critical_path_queryset(user):
    update_slack(user)
    return urgency_queryset(user, add_slack_remaining_days, 'slack')


@login_required
def manage(request):
    return object_list(
        request,
        request.user.owned_nodes.filter(
            Q(parents__isnull=True) | Q(kind='P')
        ).order_by('kind', '-created'),
        template_name='todo/manage.html',
        template_object_name='node',
        extra_context={
            'new_project_form': NewProjectForm(),
            'new_task_form': NewTaskForm(),
            'active': get_active(request.user),
        },
    )


@login_required
def scheduler_blocking(request):
    return object_list(
        request,
        blocking_queryset(request.user),
        template_name='todo/scheduler/blocking.html',
        template_object_name='node',
        extra_context = {
            'active': get_active(request.user),
        },
    )


@login_required
def scheduler_isolated(request):
    qs = isolated_queryset(request.user)
    return object_list(
        request,
        qs,
        template_name='todo/scheduler/isolated.html',
        template_object_name='node',
        extra_context = {
            'active': get_active(request.user),
        },
    )


@login_required
def scheduler_critical_path(request):
    qs = critical_path_queryset(request.user)
    return object_list(
        request,
        qs,
        template_name='todo/scheduler/full.html',
        template_object_name='node',
        extra_context = {
            'active': get_active(request.user),
        },
    )


@login_required
def feature_poll(request):
    node_list = Node.objects.raw(
        'WITH my_ratings AS (SELECT rating, node_id FROM todo_rating WHERE user_id = %d) '%request.user.pk + 
        'SELECT SUM(COALESCE(my_ratings.rating, 0)) AS rating, todo_node.* ' + 
        'FROM todo_node ' + 
        'LEFT OUTER JOIN my_ratings ON (todo_node.id = my_ratings.node_id) ' + 
        'WHERE todo_node.site_related ' + 
        'GROUP BY todo_node.id'
    )
    remaining = 5 - sum([n.rating for n in node_list])
    active = get_active(request.user)
    return render(request, 'todo/feature_poll.html', locals())


@login_required
def feature_leaderboard(request):
    stars_count = Rating.objects.aggregate(stars_count=Sum('rating'))['stars_count']
    if stars_count:
        node_list = Node.objects.filter(site_related=True).annotate(
            rating=StarAvg('ratings__rating', maximum=stars_count, normal=1)
        ).filter(rating__gt=0.0).order_by('-rating')[:5]
    else:
        node_list = Node.objects.none()
    nl = [n.rating for n in node_list]
    active = get_active(request.user)
    return render(request, 'todo/feature_leaderboard.html', locals())


@login_required
def ajax_new_node(request, parent=None, kind=None):
    if request.method != 'POST':
        raise Http404
    if parent is not None:
        parent = get_object_or_404(Node, pk=parent, owner=request.user)
    if kind == 'project':
        form = NewProjectForm(data=request.POST)
        kind = 'P'
    elif kind == 'task':
        form = NewTaskForm(data=request.POST)
        kind = 'T'
    else:
        form = NewNodeForm(data=request.POST)
    if form.is_valid():
        if kind is None:
            kind = form.cleaned_data['kind']
        if parent is not None:
            site_related = parent.site_related
        else:
            site_related = False
        node = Node.objects.create(
            name=form.cleaned_data['name'],
            kind=kind,
            site_related=site_related,
            owner=request.user,
            )
        node.save()
        if parent is not None:
            parent.dependencies.add(node)
        response = {
            'status': 'success',
            'node': {
                'pk': node.pk,
                'name': node.name,
                'kind': node.kind,
            },
        }
    else:
        response = {
            'status': 'error',
            'form_errors': form.errors,
        }
    return HttpResponse(simplejson.dumps(response), mimetype='application/javascript')


@login_required
def ajax_add_node(request, parent):
    if request.method != 'POST':
        raise Http404
    parent = get_object_or_404(Node, pk=parent, owner=request.user)
    form = AddNodeForm(data=request.POST, parent=parent)
    if form.is_valid():
        node = form.cleaned_data['node']
        parent.dependencies.add(node)
        response = {
            'status': 'success',
            'node': {
                'pk': node.pk,
                'name': node.name,
                'kind': node.kind,
            },
        }
    else:
        response = {
            'status': 'error',
            'form_errors': form.errors,
        }
    return HttpResponse(simplejson.dumps(response), mimetype='application/javascript')


@login_required
def ajax_load_node(request, pk):
    if request.method != 'GET':
        raise Http404
    node = get_object_or_404(Node, pk=pk, owner=request.user)
    ctx = {
        'node': node,
        'node_left': 'todo/node_left_navigation.html',
        'node_right': 'todo/node_right_insertion.html',
    }
    return render(request, 'todo/new_node.html', ctx)


@login_required
def ajax_load_node_details(request, pk):
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
    return render(request, 'todo/node_details.html', locals())


@login_required
def ajax_load_node_deps(request, pk):
    if request.method != 'GET':
        raise Http404
    node = get_object_or_404(Node, pk=pk, owner=request.user)
    ctx = {
        'node_list': node.dependencies.all(),
        'node_left': 'todo/node_left_navigation.html',
        'node_right': 'todo/node_right_insertion.html',
        'parent': node,
    }
    return render(request, 'todo/dependencies.html', ctx)


@login_required
def ajax_delete_node(request, pk):
    if request.method != 'POST':
        raise Http404
    node = get_object_or_404(Node, pk=pk, owner=request.user)
    node.delete();
    response = {'status': 'success'}
    return HttpResponse(simplejson.dumps(response), mimetype='application/javascript')


@login_required
def ajax_unlink_node(request, pk, parent_pk):
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
def ajax_update_node(request, pk):
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

    repeating_formset = RepeatingFormSet(
        post,
        queryset=node.repeating.filter(user=request.user),
    )

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
            'node': {
                'name': node.name,
                'kind': node.kind,
                'completed': node.completed,
            },
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
def ajax_start_tracking(request, pk):
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
        active.stop_tracking()
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

@login_required
def ajax_stop_tracking(request, pk):
    if request.method != 'POST':
        raise Http404
    active = get_object_or_404(Active, pk=pk)
    if active.work.node.owner != request.user or active.work.user != request.user:
        raise Http404
    active.stop_tracking()
    active.delete()

    response = {'status': 'success'}
    return HttpResponse(simplejson.dumps(response), mimetype='application/javascript')


@login_required
def ajax_node_ac(request):
    if request.method != 'GET' or 'term' not in request.GET:
        raise Http404
    qs = request.user.owned_nodes.filter(name__icontains=request.GET['term'])[:10]
    response = [{'label': n.path(), 'pk': n.pk} for n in qs]
    return HttpResponse(simplejson.dumps(response), mimetype='application/javascript')


@login_required
def ajax_feature_poll_submit(request):
    if request.method != 'POST':
        return Http404

    # Sanity check, make sure the user isn't trying to sneak in
    # extra votes.
    done_keys = set()
    total = 0
    for key, val in request.POST.iteritems():
        if key in done_keys:
            continue
        done_keys.add(key)
        try:
            rating_value = int(val)
        except:
            raise Http404
        total += rating_value
    if total > 5 or total < 0:
        raise Http404

    done_keys = set()
    for key, val in request.POST.iteritems():
        if key in done_keys:
            continue
        done_keys.add(key)

        if key[:5] != 'node_':
            continue
        try:
            pk = int(key[5:])
            rating_value = int(val)
        except:
            raise Http404

        # Be sure the node is a child of the website project.
        node = get_object_or_404(Node, pk=pk, site_related=True)

        # If the node has zero votes try and erase any existing rating.
        if rating_value == 0:
            try:
                rating = Rating.objects.get(user=request.user, node=node)
                rating.delete()
            except:
                pass

        # If the node has votes update or create a new node.
        else:
            try:
                rating = Rating.objects.get(user=request.user, node=node)
            except:
                rating = Rating.objects.create(user=request.user, node=node)
            rating.rating = rating_value
            rating.save()

    response = {'status': 'success'}
    return HttpResponse(simplejson.dumps(response), mimetype='application/javascript')
