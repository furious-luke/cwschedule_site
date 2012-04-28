from django.utils.datastructures import SortedDict


##
# Refer to django/forms/forms.py for the original.
def get_declared_objects(bases, attrs, obj_class, obj_tag, with_base_objs=True):

    # Pull the objects and order them using a counter on the "obj" class.
    objs = [(name, attrs.pop(name)) for name, obj in attrs.items() if isinstance(obj, obj_class)]
    objs.sort(key=lambda x: x[1].creation_counter)

    # Grab base class objects.
    if with_base_objs:
        tag = 'base_' + obj_tag
        for base in bases[::-1]:
            if hasattr(base, tag):
                objs = getattr(base, tag).items() + objs
    else:
        tag = 'declared_' + obj_tag
        for base in bases[::-1]:
            if hasattr(base, tag):
                objs = getattr(base, tag).items() + objs

    # Store in a Django sorted dictionary.
    return SortedDict(objs)
