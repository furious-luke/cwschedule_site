from django.core.urlresolvers import reverse
from django.utils.safestring import mark_safe
from django.forms.widgets import Media, media_property
from django.utils.copycompat import deepcopy

from pythonutils.html import AttrDict

from nav import *


##
# This is used to build a set of navs on Navbar classes. Refer to
# django/forms/forms.py for the original.
class DeclarativeNavsMetaclass(type):

    def __new__(cls, name, bases, attrs):
        attrs['base_navs'] = get_declared_objects(bases, attrs, Nav, 'navs')
        new_class = super(DeclarativeNavsMetaclass, cls).__new__(cls, name, bases, attrs)
        if 'media' not in attrs:
            new_class.media = media_property(new_class)
        return new_class


class BaseNavbar(object):

    def __init__(self, user=None, active=None):
        self.user = user
        self.active = active
        self.navs = deepcopy(self.base_navs)

    def __unicode__(self):
        return self.render()

    def __getitem__(self, name):
        try:
            nav = self.navs[name]
        except KeyError:
            raise KeyError('Key %r not found in Navbar'%name)
        return BoundNav(self, nav, name)

    def render(self, attrs={}):
        final_attrs = {
            'class': ['navbar', 'navbar-fixed-top'],
        }
        final_attrs = AttrDict(final_attrs, mergers=['class'])
        final_attrs.update(attrs)
        html = [
            u'<div%s>'%unicode(final_attrs),
            u'<div class="navbar-inner">',
            u'<div class="container">',
        ]

        if self.brand:
            html.extend([
                u'<a class="brand" href="/">%s</a>'%unicode(self.brand),
            ])

        for name in self.navs.iterkeys():
            html.append(self[name].render())

        html.extend([
            u'</div>',
            u'</div>',
            u'</div>',
        ])
        return mark_safe(u'\n'.join(html))


class Navbar(BaseNavbar):
    __metaclass__ = DeclarativeNavsMetaclass


class BoundNav(object):

    def __init__(self, navbar, nav, name):
        self.navbar = navbar
        self.nav = nav
        self.name = name

    def __unicode__(self):
        return self.render()

    def __getitem__(self, name):
        try:
            entry = self.nav.entries[name]
        except KeyError:
            raise KeyError('Key %r not found in Nav'%name)
        return BoundEntry(self, entry, name)

    def render(self, attrs={}):
        final_attrs = {
            'class': ['nav'],
        }
        final_attrs = AttrDict(final_attrs, mergers=['class'])
        final_attrs.update(attrs)
        final_attrs.update({
            'class': 'pull-left' if (self.nav.align == 'left') else 'pull-right'
        })
        html = [
            u'<ul%s>'%unicode(final_attrs),
        ]

        for name in self.nav.entries.iterkeys():
            html.append(self[name].render())

        html.append(u'</ul>')
        return mark_safe(u'\n'.join(html))
