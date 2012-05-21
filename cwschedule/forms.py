from datetime import datetime

from dateutil import parser as dtparser

from django.forms import *
from django.forms.models import modelformset_factory

from timedelta.widgets import TimedeltaWidget
from cwschedule.models import Node, Repeating


__all__ = ['CreateNodeForm', 'LinkNodeForm', 'NodeDetailsForm', 'RepeatingFormSet']


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


class LinkNodeForm(Form):
    node = ModelChoiceField(
        Node.objects.all(),
        required=True,
        widget=TextInput(attrs={'placeholder': 'Name'}),
    )

    def __init__(self, *args, **kwargs):
        self._parent = kwargs.pop('parent', None)
        super(LinkNodeForm, self).__init__(*args, **kwargs)

    def clean_node(self):
        data = self.cleaned_data['node']

        # Must not already be a dependency.
        qs = self._parent.dependencies.all()
        for n in qs:
            if n.pk == data.pk:
                raise ValidationError(u'Node already a dependency of parent.')

        # Cannot create a dependency cycle.
        stack = [self._parent]
        while len(stack):
            cur = stack.pop()
            if cur.pk == data.pk:
                raise ValidationError(u'Creates a dependency cycle.')
            stack.extend(cur.parents.all())

        return data


class NodeDetailsForm(ModelForm):
    dead_line = ParseDateTimeField(required=False)

    class Meta:
        model = Node
        exclude = ('created', 'owner', 'dependencies', 'accumulated')

    def __init__(self, *args, **kwargs):
        is_staff = kwargs.pop('is_staff', False)
        super(NodeDetailsForm, self).__init__(*args, **kwargs)
        if not is_staff:
            del self.fields['site_related']

    def clean_completed(self):
        data = self.cleaned_data['completed']
        if data:
            stack = list(self.instance.dependencies.all())
            while len(stack):
                cur = stack.pop()
                if not cur.completed:
                    raise ValidationError(u'Has incomplete dependencies.')
                stack.extend(list(cur.dependencies.all()))
        return data


class RepeatingForm(ModelForm):
    skip = IntegerField(min_value=1, initial=1, widget=TextInput(attrs={'class': 'skip'}))

    class Meta:
        model = Repeating
        widgets = {
            'node': HiddenInput,
            'user': HiddenInput,
        }

    def __init__(self, *args, **kwargs):
        self._cur_user = kwargs.pop('current_user', None)
        super(RepeatingForm, self).__init__(*args, **kwargs)


RepeatingFormSet = modelformset_factory(
    Repeating,
    form=RepeatingForm,
    can_delete=True,
    extra=1,
)
