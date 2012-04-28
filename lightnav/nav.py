from django.utils.safestring import mark_safe
from django.forms.widgets import Media, media_property
from django.utils.copycompat import deepcopy

from declarative import *
from .entry import *


##
# This is used to build a set of entries on Nav classes. Refer to
# django/forms/forms.py for the original.
class DeclarativeEntriesMetaclass(type):

    def __new__(cls, name, bases, attrs):
        attrs['base_entries'] = get_declared_objects(bases, attrs, Entry, 'entries')
        new_class = super(DeclarativeEntriesMetaclass, cls).__new__(cls, name, bases, attrs)
        if 'media' not in attrs:
            new_class.media = media_property(new_class)
        return new_class


class BaseNav(object):

    creation_counter = 0

    def __init__(self, align='left'):
        self.entries = deepcopy(self.base_entries)
        self.align = align

        # Increase the creation counter, and save our local copy.
        self.creation_counter = BaseNav.creation_counter
        BaseNav.creation_counter += 1


class Nav(BaseNav):
    __metaclass__ = DeclarativeEntriesMetaclass


class BoundEntry(object):

    def __init__(self, nav, entry, name):
        self.nav = nav
        self.entry = entry
        self.name = name

    def __unicode__(self):
        return self.render()

    def render(self, attrs={}):
        active = self.nav.navbar.active
        user = self.nav.navbar.user
        return mark_safe(self.entry.render(active, user))
