from django import forms
import datetime

from helpers import nice_repr, parse

class TimedeltaWidget(forms.TextInput):
    def __init__(self, *args, **kwargs):
        return super(TimedeltaWidget, self).__init__(*args, **kwargs)
        
    def render(self, name, value, attrs):
        if value in (None, u''):
            value = None #u'0 days'
        elif isinstance(value, (str, unicode)):
            pass
        else:
            if isinstance(value, int):
                value = datetime.timedelta(seconds=value)
            value = nice_repr(value)
        return super(TimedeltaWidget, self).render(name, value, attrs)
    
    def _has_changed(self, initial, data):
        """
        We need to make sure the objects are of the canonical form, as a
        string comparison may needlessly fail.
        """
        if initial in ["", None] and data in ["", None]:
            return False
            
        if initial in ["", None] or data in ["", None]:
            return True
        
        if initial:
            if not isinstance(initial, datetime.timedelta):
                initial = parse(initial)

        if not isinstance(data, datetime.timedelta):
            data = parse(data)
        
        return initial != data
