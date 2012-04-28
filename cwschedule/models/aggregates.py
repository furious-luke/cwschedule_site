from django.db.models.sql.aggregates import Aggregate


__all__ = ['SumCoalesce', 'StarAvg']


class LocalAggregate(Aggregate):

    def __init__(self, lookup, **extra):
        self.lookup = lookup
        self.extra = extra

    def _default_alias(self):
        return '%s__%s'%(self.lookup, self.name.lower())
    default_alias = property(_default_alias)

    def add_to_query(self, query, alias, col, source, is_summary):
        super(LocalAggregate, self).__init__(col, source=source, is_summary=is_summary, **self.extra)
        query.aggregates[alias] = self


class SumCoalesce(LocalAggregate):
    name = 'SumCoalesce'
    sql_function = 'SUM'
    sql_template = '%(function)s(COALESCE(%(field)s, 0))'


class StarAvg(LocalAggregate):
    name = 'StarAvg'
    sql_function = 'SUM'
    sql_template = '%(normal)f*%(function)s(COALESCE(%(field)s, 0))/%(maximum)f'
    is_computed = True
