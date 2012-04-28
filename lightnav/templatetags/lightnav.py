from django.template import Context
from django.template.loader import get_template
from django import template


register = template.Library()


def import_navbar(module):
    idx = module.rfind('.')
    return getattr(__import__(module[:idx], fromlist=[module[idx + 1:]]), module[idx + 1:])


@register.simple_tag(takes_context=True)
def navbar(context, module):
    navbar = import_navbar(module)
    user = context['user']
    active = context['request'].get_full_path()
    return navbar(user=user, active=active).render()


@register.simple_tag()
def navbar_media(module):
    navbar = import_navbar(module)
    return navbar().media
