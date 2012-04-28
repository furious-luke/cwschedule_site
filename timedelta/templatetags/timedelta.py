import datetime
from django import template
register = template.Library()

# Don't really like using relative imports, but no choice here!
from ..helpers import nice_repr, iso8601_repr

@register.filter(name='timedelta')
def timedelta(value, display="long"):
    return nice_repr(value, display)

@register.filter(name='iso8601')
def iso8601(value):
    return iso8601_repr(value)

@register.filter(name='approx_timedelta')
def approx_timedelta(value, display="long"):
    ts = value.total_seconds()
    if ts >= 600: # 10 minutes
        ts -= ts%60 # no seconds
        if ts >= 36000: # 10 hours
            ts -= ts%3600 # no minutes
            if ts >= 864000: # 10 days
                ts -= ts%86400 # no hours
                if ts >= 6048000: # 10 weeks
                    ts -= ts%604800 # no days
    value = datetime.timedelta(0, ts)
    return nice_repr(value, display)
