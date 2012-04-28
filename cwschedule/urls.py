from django.conf.urls import patterns, include, url
from django.views.generic.simple import direct_to_template, redirect_to

from .views import *


urlpatterns = patterns('',
    url(r'^$', direct_to_template, {'template': 'welcome.html'}, name='welcome'),
    url(r'^accounts/logout/$', 'django.contrib.auth.views.logout', {'next_page': '/'}),
    url(r'^accounts/profile/$', redirect_to, {'url': '/manage/'}, name='profile'),
    url(r'^accounts/', include('registration.backends.default.urls')),

    url(r'^manage/$', 'cwschedule.views.manage', name='manage'),
    url(r'^node/create/$', 'cwschedule.views.create_node', name='create_node'),
    url(r'^node/(\d+)/children/$', 'cwschedule.views.node_children', name='node_children'),
)
