import datetime, calendar

from django.db.models import *
from django.contrib.auth.models import User

from timedelta import TimedeltaField


__all__ = ['Node', 'Rating', 'Work', 'Active', 'Repeating', 'User']


tdzero = datetime.timedelta(0)


class Node(Model):
    KIND_CHOICES = (
        ('P', 'Project'),
        ('T', 'Task'),
    )
    PRIORITY_CHOICES = (
        (0, 'None'),
        (1, 'Lowest'),
        (2, 'Low'),
        (3, 'Moderate'),
        (4, 'High'),
        (5, 'Highest'),
    )

    name             = CharField(max_length=200)
    kind             = CharField(max_length=1, choices=KIND_CHOICES, default='T')
    site_related     = BooleanField(default=False)
    description      = TextField(blank=True)
    priority         = IntegerField(choices=PRIORITY_CHOICES, default=0)
    initial_estimate = TimedeltaField(null=True, blank=True)
    ongoing_estimate = TimedeltaField(null=True, blank=True)
    accumulated      = TimedeltaField(default=tdzero)
    commencement     = DateTimeField(null=True, blank=True)
    dead_line        = DateTimeField(null=True, blank=True)
    completed        = BooleanField(default=False)
    created          = DateTimeField(auto_now_add=True)
    owner            = ForeignKey(User, related_name='owned_nodes')
    dependencies     = ManyToManyField('Node', related_name='parents', blank=True, null=True)

    class Meta:
        app_label = 'cwschedule'
        ordering = ('kind', '-created')

    def __unicode__(self):
        return u'%s'%self.name

    @property
    def estimate(self):
        if self.ongoing_estimate == tdzero:
            return self.initial_estimate
        else:
            return self.ongoing_estimate

    @property
    def work_remaining(self):
        if not self.estimate:
            return datetime.timedelta(0)
        else:
            return self.estimate - self.accumulated

    def parent_pks(self):
        return [p.pk for p in self.parents.all()]

    def child_pks(self):
        return [c.pk for c in self.dependencies.all()]

    def descendants(self):
        desc_list = list(self.dependencies.all())
        desc_set = set(desc_list)
        while len(desc_list):
            node = desc_list.pop()
            new_nodes = list(node.dependencies.all())
            desc_list.extend(new_nodes)
            desc_set.update(new_nodes)
        return desc_set

    def path(self):
        path = [self.name]
        parents = self.parents.all()[:1]
        while len(parents):
            path.insert(0, parents[0].name)
            parents = parents[0].parents.all()[:1]
        return u'/'.join(path)

    def iter_branches(self):
        def _recurse(node, branch):
            parents = node.parents.all()
            if len(parents):
                for p in parents:
                    for b2 in  _recurse(p, [p] + branch):
                        yield b2
            else:
                yield branch
        for b1 in _recurse(self, [self]):
            yield b1

    def html_children(self):
        return u' '.join(map(unicode, self.dependencies.all().values_list('pk', flat=True)))

    def html_parents(self):
        return u' '.join(map(unicode, self.parents.all().values_list('pk', flat=True)))

    def has_estimate(self):
        return self.estimate > tdzero

    def is_late(self):
        return self.time_remaining() < tdzero

    def overdue(self):
        return tdzero - self.time_remaining()

    def time_until_dead_line(self, now=None):
        if self.dead_line == None:
            return None
        if now is None:
            now = datetime.datetime.now()
        return self.dead_line - now

    ##
    ## Return the rem
    def time_remaining(self, now=None):
        if self.dead_line == None:
            return None
        if now is None:
            now = datetime.datetime.now()
        return self.dead_line - now

    def update_effective_fields(self):
        parents = list(self.parents.all())
        edl = self.dead_line
        while len(parents):
            cur = parent.pop()
            if not edl or (cur.dead_line and cur.dead_line < edl):
                edl = cur.dead_line
            parents.extend(cur.parents())
        self.dead_line = edl
        self.save()

    def progress(self):
        if not self.estimate:
            return None
        return self.accumulated.total_seconds()/self.estimate.total_seconds()

    def progress_percentage(self):
        if not self.estimate:
            return None
        if self.completed:
            return 100
        return 100.0*self.accumulated.total_seconds()/self.estimate.total_seconds()

    ##
    ## Calculate nearest dead-line.
    ##
    ## Calculates the dead-line taking into consideration any repeating
    ## associations.
    ##
    def nearest_dead_line(self):
        repeats = self.repeating.all()
        dl = self.dead_line
        for repeat in repeats:
            rpl = repeat.dead_line()
            


class Rating(Model):
    RATING_CHOICES = (
        (0, 'None'),
        (1, 'Lowest'),
        (2, 'Low'),
        (3, 'Moderate'),
        (4, 'High'),
        (5, 'Highest'),
    )

    rating = IntegerField(choices=RATING_CHOICES, default=0)
    node = ForeignKey(Node, related_name='ratings')
    user = ForeignKey(User, related_name='ratings')

    class Meta:
        app_label = 'cwschedule'
        unique_together = (('node', 'user'),)


class Work(Model):
    date  = DateField()
    time = TimedeltaField(default=tdzero)
    user  = ForeignKey(User, related_name='work')
    node  = ForeignKey(Node, related_name='work')

    class Meta:
        app_label = 'cwschedule'
        unique_together = (('date', 'node', 'user'),)

    def __unicode__(self):
        return u'%s %s'%(unicode(self.node), unicode(self.date))


class Active(Model):
    work = ForeignKey(Work, related_name='active')
    begin = DateTimeField(auto_now_add=True)

    class Meta:
        app_label = 'cwschedule'

    def stop_tracking(self):
        duration = datetime.datetime.now() - self.begin
        remaining_today = datetime.datetime.combine(self.begin.date() + datetime.timedelta(days=1), datetime.time(0)) - self.begin

        self.work.node.accumulated += duration
        self.work.node.save()

        cur_work = self.work
        while duration:
            if duration > remaining_today:
                cur_work.time += remaining_today
                duration -= remaining_today
            else:
                cur_work.time += duration
                duration -= duration
            cur_work.save()

            if duration:
                next_day = cur_work.date + datetime.timedelta(days=1)
                cur_work, created = Work.objects.get_or_create(date=next_day, user=cur_work.user, node=cur_work.node)
                remaining_today = datetime.timedelta(days=1)


class Repeating(Model):
    PERIOD_CHOICES = (
        ('DA', 'Day(s)'),
        ('WD', 'Weekday(s)'),
        ('WN', 'Weekend(s)'),
        ('WK', 'Week(s)'),
        ('MT', 'Month(s)'),
        ('YE', 'Year(s)'),
        ('MO', 'Monday(s)'),
        ('TU', 'Tuesday(s)'),
        ('WE', 'Wednesday(s)'),
        ('TH', 'Thursday(s)'),
        ('FR', 'Friday(s)'),
        ('SA', 'Saturday(s)'),
        ('SU', 'Sunday(s)'),
    )

    node = ForeignKey(Node, related_name='repeating')
    user = ForeignKey(User, related_name='+')
    period = CharField(max_length=2, choices=PERIOD_CHOICES, default='DA')
    skip = IntegerField(default=1)

    class Meta:
        app_label = 'cwschedule'

    def __unicode__(self):
        if self.period == 'NO':
            return 'None'
        else:
            return u'Every %d %s'%(self.skip, self.pluralise())

    def pluralise(self):
        period = self.get_period_display().lower()
        if self.skip == 1:
            period = period[:-3]
        if period[:2] in ('mo', 'tu', 'we', 'th', 'fr', 'sa', 'su'):
            period = period.capitalize()
        return period

    ##
    ## Calculate the next/current commencement.
    ##
    def commencement(self):
        td = datetime.timedelta
        if self.period == 'DA':    # daily
            tod = datetime_today()
            return tod
        elif self.period == 'WD':  # weekdays
            tod = datetime_today()
            wd = tod.weekday()
            return tod + td(0 if wd <= 4 else (2 - (wd - 5)))
        elif self.period == 'WN':  # weekends
            tod = datetime_today()
            wd = tod.weekday()
            return tod + td(5 - wd);
        elif self.period == 'WK':  # weekly
            tod = datetime_today()
            return tod + td(0 - tod.isoweekday()%7)
        elif self.period == 'MT':  # monthly
            return datetime_this_month()
        elif self.period == 'YE':  # yearly
            return datetime_this_year()
        elif self.period == 'MO':  # Mondays
            tod = datetime_today()
            wd = tod.weekday()
            return tod + td((7 - wd)%7)
        elif self.period == 'TU':  # Tuesdays
            tod = datetime_today()
            wd = tod.weekday()
            return tod + td((8 - wd)%7)
        elif self.period == 'WE':  # Wednesdays
            tod = datetime_today()
            wd = tod.weekday()
            return tod + td((9 - wd)%7)
        elif self.period == 'TH':  # Thursdays
            tod = datetime_today()
            wd = tod.weekday()
            return tod + td((10 - wd)%7)
        elif self.period == 'FR':  # Fridays
            tod = datetime_today()
            wd = tod.weekday()
            return tod + td((11 - wd)%7)
        elif self.period == 'SA':  # Saturdays
            tod = datetime_today()
            wd = tod.weekday()
            return tod + td((12 - wd)%7)
        elif self.period == 'SU':  # Sundays
            tod = datetime_today()
            wd = tod.weekday()
            return tod + td((13 - wd)%7)

    ##
    ## Calculate the next dead-line.
    ##
    def dead_line(self):
        td = datetime.timedelta
        com = self.commencement()
        if self.period == 'DA':    # daily
            return com + td(1)
        elif self.period == 'WD':  # weekdays
            return com + td(1)
        elif self.period == 'WN':  # weekends
            return com + td(2)
        elif self.period == 'WK':  # weekly
            return com + td(7)
        elif self.period == 'MT':  # monthly
            return com + td(calendar.monthrange(com.year, com.month))
        elif self.period == 'YE':  # yearly
            return com + td(365)
        elif self.period == 'MO':  # Mondays
            return com + td(1)
        elif self.period == 'TU':  # Tuesdays
            return com + td(1)
        elif self.period == 'WE':  # Wednesdays
            return com + td(1)
        elif self.period == 'TH':  # Thursdays
            return com + td(1)
        elif self.period == 'FR':  # Fridays
            return com + td(1)
        elif self.period == 'SA':  # Saturdays
            return com + td(1)
        elif self.period == 'SU':  # Sundays
            return com + td(1)
