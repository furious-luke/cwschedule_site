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
    url(r'^node/(\d+)/create/$', 'cwschedule.views.create_node', name='create_node'),
    url(r'^node/(\d+)/link/$', 'cwschedule.views.link_node', name='link_node'),
    url(r'^node/(\d+)/delete/$', 'cwschedule.views.delete_node', name='delete_node'),
    url(r'^node/(\d+)/unlink/(\d+)/$', 'cwschedule.views.unlink_node', name='unlink_node'),
    url(r'^node/(\d+)/update/$', 'cwschedule.views.update_node', name='update_node'),
    url(r'^node/(\d+)/$', 'cwschedule.views.node', name='node'),
    url(r'^node/(\d+)/details/$', 'cwschedule.views.node_details', name='node_details'),
    url(r'^node/(\d+)/children/$', 'cwschedule.views.node_children', name='node_children'),

    url(r'^node/(\d+)/activate/$', 'cwschedule.views.activate', name='activate'),
    url(r'^active/(\d+)/deactivate/$', 'cwschedule.views.deactivate', name='deactivate'),

    url(r'^ac/path/$', 'cwschedule.views.ac_path', name='ac_path'),
)
