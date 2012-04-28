from datetime import datetime

from dateutil import parser as dtparser

from django.forms import *
from django.forms.models import modelformset_factory

from timedelta.widgets import TimedeltaWidget
from cwschedule.models import Node, Repeating


__all__ = ['CreateNodeForm']


class ParseDateTimeField(forms.Field):

    def clean(self, value):
        super(ParseDateTimeField, self).clean(value)
        if value in (None, ''):
            return None
        elif isinstance(value, datetime):
            return value
        try:
            return dtparser.parse(value)
        except ValueError:
            raise ValidationError(u'Enter a valid date and time.')


class CreateNodeForm(ModelForm):

    class Meta:
        model = Node
        fields = ('name', 'dead_line', 'initial_estimate')
        widgets = {
            'name': TextInput(attrs={'placeholder': 'Name'}),
            'dead_line': TextInput(attrs={'placeholder': 'Deadline'}),
            'initial_estimate': TextInput(attrs={'placeholder': 'Estimate'}),
        }
