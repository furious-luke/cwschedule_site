from django.contrib import admin

from .models import *


class NodeAdmin(admin.ModelAdmin):
    filter_horizontal = ['dependencies']

admin.site.register(Node, NodeAdmin)


class RatingAdmin(admin.ModelAdmin):
    pass

admin.site.register(Rating, RatingAdmin)


class WorkAdmin(admin.ModelAdmin):
    pass

admin.site.register(Work, WorkAdmin)


class ActiveAdmin(admin.ModelAdmin):
    pass

admin.site.register(Active, ActiveAdmin)

class RepeatingAdmin(admin.ModelAdmin):
    pass

admin.site.register(Repeating, RepeatingAdmin)
