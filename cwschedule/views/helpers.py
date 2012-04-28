from ..models import *


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
