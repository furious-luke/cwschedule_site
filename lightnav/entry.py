from django.core.urlresolvers import reverse
from django.forms.widgets import MediaDefiningClass


class Entry(object):
    __metaclass__ = MediaDefiningClass

    creation_counter = 0

    def __init__(self, tag, is_staff=None, is_logged_in=None):
        self.tag = tag
        self.is_staff = is_staff
        self.is_logged_in = is_logged_in

        # Increase the creation counter, and save our local copy.
        self.creation_counter = Entry.creation_counter
        Entry.creation_counter += 1

    def render(self, active=None, user=None):
        if not self.is_staff or (user and user.is_staff):
            html = [
                '<li>',
                '<a href="#">%s</a>'%self.tag,
                '</li>',
            ]
            return u'\n'.join(html)
        else:
            return u''

    def is_enabled(self, user):
        if self.is_staff == True and (not user or not user.is_staff):
            return False
        if self.is_staff == False and (user and user.is_staff):
            return False
        if self.is_logged_in == True and (not user or not user.is_authenticated()):
            return False
        if self.is_logged_in == False and (user and user.is_authenticated()):
            return False
        return True


class Link(Entry):

    def __init__(self, tag, url, **kwargs):
        super(Link, self).__init__(tag, **kwargs)
        self._url = url

    @property
    def url(self):
        if self._url:
            if self._url[0] == '/':
                return self._url
            else:
                return reverse(self._url)
        else:
            return '#'

    def is_active(self, active):
        return self.url == active

    def render(self, active=None, user=None):
        if self.is_enabled(user):
            html = [
                '<li%s>'%(' class="active"' if self.is_active(active) else ''),
                '<a href="%s">%s</a>'%(self.url, self.tag),
                '</li>',
            ]
            return u'\n'.join(html)
        else:
            return u''


class Dropdown(Entry):

    def __init__(self, tag, entries, **kwargs):
        super(Dropdown, self).__init__(tag, **kwargs)
        self.entries = entries

    def render(self, active=False, user=None):
        if self.is_enabled(user):
            html = [
                u'<li class="dropdown">',
                u'<a href="#" class="dropdown-toggle" data-toggle="dropdown">%s<b class="caret"></b></a>'%self.tag,
                u'<ul class="dropdown-menu">',
            ]
            for entry in self.entries:
                html.append(entry.render(False, user))
            html.extend([
                u'</ul>',
                u'</li>',
            ])
            return u'\n'.join(html)
        else:
            return u''


class VerticalDivider(Entry):

    def __init__(self, **kwargs):
        super(VerticalDivider, self).__init__('', **kwargs)

    def render(self, active=False, user=None):
        if self.is_enabled(user):
            return u'<li class="divider-vertical"></li>'
        else:
            return u''


class HorizontalDivider(Entry):

    def __init__(self, **kwargs):
        super(HorizontalDivider, self).__init__('', **kwargs)

    def render(self, active=False, user=None):
        if self.is_enabled(user):
            return u'<li class="divider"></li>'
        else:
            return u''
