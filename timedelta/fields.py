from django.db import models

from collections import defaultdict
import datetime

from helpers import parse
from forms import TimedeltaFormField

SECS_PER_DAY = 60*60*24

# TODO: Figure out why django admin thinks fields of this type have changed every time an object is saved.

# Define the different column types that different databases can use.
COLUMN_TYPES = defaultdict(lambda:"char(20)")
COLUMN_TYPES["django.db.backends.postgresql_psycopg2"] = "interval"
COLUMN_TYPES["django.contrib.gis.db.backends.postgis"] = "interval"

class TimedeltaField(models.Field):
    """
    Store a datetime.timedelta as an INTERVAL in postgres, or a 
    CHAR(20) in other database backends.
    """
    __metaclass__ = models.SubfieldBase
    _south_introspects = True
    
    description = "A datetime.timedelta object"
    
    def to_python(self, value):
        if (value is None) or isinstance(value, datetime.timedelta):
            return value
        if isinstance(value, int):
            return datetime.timedelta(seconds=value)
        if value == "":
            return datetime.timedelta(0)
        return parse(value)
    
    def get_prep_value(self, value):
        if (value is None) or isinstance(value, (str, unicode)):
            return value
        return str(value).replace(',', '')
        
    def get_db_prep_value(self, value, connection=None, prepared=None):
        return self.get_prep_value(value)
        
    def formfield(self, *args, **kwargs):
        defaults = {'form_class':TimedeltaFormField}
        defaults.update(kwargs)
        return super(TimedeltaField, self).formfield(*args, **defaults)
    
    def value_to_string(self, obj):
        value = self._get_val_from_obj(obj)
        return unicode(value)
    
    def get_default(self):
        """
        Needed to rewrite this, as the parent class turns this value into a
        unicode string. That sux pretty deep.
        """
        if self.has_default():
            if callable(self.default):
                return self.default()
            return self.get_prep_value(self.default)
        if not self.empty_strings_allowed or (self.null):
            return None
        return ""
        
    def db_type(self, connection):
        return COLUMN_TYPES[connection.settings_dict['ENGINE']]


