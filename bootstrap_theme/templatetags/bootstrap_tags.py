from django.template import Context
from django.template.loader import get_template
from django import template


register = template.Library()


@register.filter
def as_bootstrap(form):
    template = get_template('bootstrap/form.html')
    ctx = Context({'form': form})
    return template.render(ctx)


@register.filter
def as_bootstrap_field(field):
    template = get_template('bootstrap/field.html')
    ctx = Context({'field': field})
    return template.render(ctx)
