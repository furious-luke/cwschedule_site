from django import forms
from django.utils.translation import ugettext_lazy as _

import datetime
from collections import defaultdict

from widgets import TimedeltaWidget
from helpers import parse

class TimedeltaFormField(forms.Field):
    default_error_messages = {
        'invalid':_('Enter a valid time span: e.g. "3 days, 4 hours, 2 minutes"')
    }
    
    def __init__(self, *args, **kwargs):
        defaults = {'widget':TimedeltaWidget}
        defaults.update(kwargs)
        super(TimedeltaFormField, self).__init__(*args, **defaults)
        
    def clean(self, value):
        super(TimedeltaFormField, self).clean(value)
        if value in ('', None) and not self.required:
            return u''
        
        data = defaultdict(float)
        try:
            return parse(value)
        except TypeError:
            raise forms.ValidationError(self.error_messages['invalid'])
            
        return datetime.timedelta(**data)

class TimedeltaChoicesField(TimedeltaFormField):
    def __init__(self, *args, **kwargs):
        choices = kwargs.pop('choices')
        defaults = {'widget':forms.Select(choices=choices)}
        defaults.update(kwargs)
        super(TimedeltaChoicesField, self).__init__(*args, **defaults)
