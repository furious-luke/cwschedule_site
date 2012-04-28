from django.db.models.signals import pre_save
from django.dispatch import receiver

from .models import Node


__all__ = []


# @receiver(pre_save, sender=Node, dispatch_uid='node_pre_save')
# def node_pre_save(sender, instance, **kwargs):
#     instance.effective_dead_line = instance.dead_line


# @reciever(post_save, sender=Node, dispatch_uid='node_post_save')
# def node_post_save(sender, instance, created, raw, **kwargs):
#     pass


# @reciever(pre_delete, sender=Node, dispatch_uid='node_delete_begin')
# def node_delete_begin(sender, *args, **kwargs):
#     pass


# @reciever(post_delete, sender=Node, dispatch_uid='node_delete_end')
# def node_delete_end(sender, instance, created, raw, **kwargs):
#     if raw:
#         return
