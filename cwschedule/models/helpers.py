import datetime


__all__ = ['datetime_today', 'datetime_this_month', 'datetime_this_year',
           'owned_root_nodes', 'find_leaf_nodes', 'node_root', 'user_ratings_map', 'update_all',
           'update_effective_work_remaining', 'calc_early_finish', 'calc_late_start',
           'calc_critical_path', 'own_critical_path', 'update_slack']


tdzero = datetime.timedelta(0)


def datetime_today():
    cd = datetime.date.today()
    return datetime.datetime(cd.year, cd.month, cd.day);


def datetime_this_month():
    cd = datetime.date.today()
    return datetime.datetime(cd.year, cd.month, 1);


def datetime_this_year():
    cd = datetime.date.today()
    return datetime.datetime(cd.year, 1, 1);


def owned_root_nodes(user):
    # Get the root nodes and select all related entries as we will
    # be traversing them anyhow.
    return user.owned_nodes.filter(parents__isnull=True).prefetch_related()


def find_leaf_nodes(root_nodes):
    leaf_nodes = []
    stack = list(root_nodes)
    while len(stack):
        cur = stack.pop()
        if not cur.dependencies.exists():
            leaf_nodes.append(cur)
        stack.extend(cur.dependencies.all())
    return leaf_nodes


##
## Find the root of a node.
##
def node_root(node):
    cur = node
    while cur.parents.exists():
        cur = cur.parents.all()[0]
    return cur

##
## Shortcut for calcaulating critical path.
##
def own_critical_path(user):
    root_nodes = owned_root_nodes(user)
    leaf_nodes = find_leaf_nodes(root_nodes)
    late_start = {}
    early_finish = {}
    slack = {}
    critical_path = {}
    now = datetime.datetime.now()
    calc_early_finish(root_nodes, early_finish, now);
    calc_late_start(leaf_nodes, early_finish, late_start, now);
    calc_slack(early_finish, late_start, slack)
    calc_critical_path(root_nodes, slack, critical_path)
    return critical_path


##
## Update model slack.
##
def update_slack(user):
    slack = own_slack(user)
    for node, sl in slack.iteritems():
        node.slack = sl
        node.save()


##
## Shortcut for calcaulating slack.
##
def own_slack(user):
    root_nodes = owned_root_nodes(user)
    leaf_nodes = find_leaf_nodes(root_nodes)
    late_start = {}
    early_finish = {}
    slack = {}
    now = datetime.datetime.now()
    calc_early_finish(root_nodes, early_finish, now);
    calc_late_start(leaf_nodes, early_finish, late_start, now);
    calc_slack(early_finish, late_start, slack)
    return slack


##
## Calculate the critical path.
##
def calc_critical_path(root_nodes, slack, critical_path):

    def _calc_node(node):
        cp = critical_path.get(node, None)
        if cp is not None:
            return cp

        # Construct tuples of my children's paths.
        paths = [_calc_node(child) for child in node.dependencies.all()]

        # Find the path with the least slack to become mine. If there are no paths,
        # then we must be a leaf node, initialise the path.
        if len(paths):
            min_path = min(paths, key=lambda x: x[1])
        else:
            min_path = [[], datetime.timedelta(0)]

        # Add myself to the path, so long as I
        my_path = [list(min_path[0]) + [node], min_path[1] + (slack[node] if slack[node] is not None else datetime.timedelta(0))]
        critical_path[node] = my_path

        return my_path

    # Process each node.
    for node in root_nodes:
        _calc_node(node)


def calc_slack(early_finish, late_start, slack):
    for node, ef in early_finish.iteritems():
        if late_start[node][1] is not None:
            slack[node] = late_start[node][1] + node.work_remaining - ef[1]
        else:
            slack[node] = None


def calc_early_finish(root_nodes, early_finish, now):

    def _calc_node(node):
        ef = early_finish.get(node, None)
        if ef is not None:
            return ef[1]

        # Construct tuples of my children's early finishes and their nodes.
        paths = [[child, _calc_node(child)] for child in node.dependencies.all()]

        # Add my commencement, if I happen to have one.
        if node.commencement:
            paths.append([None, node.commencement])

        # If there is nothing in my set of paths then I can begin now.
        if not len(paths):
            early_finish[node] = [None, now]
        else:

            # Find the early finish, which is the maximum of my children.
            early_finish[node] = max(paths, key=lambda x: x[1])

        # Add the duration and return.
        early_finish[node][1] += node.work_remaining
        return early_finish[node][1]

    # Process each node.
    for node in root_nodes:
        _calc_node(node)


def calc_late_start(leaf_nodes, early_finish, late_start, now):

    def _calc_node(node):
        ls = late_start.get(node, None)
        if ls is not None:
            return ls[1]

        # Construct tuples of my parent's late starts and their nodes.
        paths = [[parent, _calc_node(parent)] for parent in node.parents.all()]

        # Add my deadline, if I happen to have one.
        if node.dead_line:
            paths.append([None, node.dead_line])

        # Filter out any paths that have None as their time.
        paths = filter(lambda x: x[1] is not None, paths)

        # If there is nothing in my set of paths then set to None, becuase we need to
        # know elsewhere that this has no urgency.
        if not len(paths):
            late_start[node] = [None, None] #early_finish[node][1]]
        else:

            # Find the late start, which is the maximum of my parents.
            late_start[node] = min(paths, key=lambda x: x[1])

        # Subtract the duration.
        if late_start[node][1] is not None:
            late_start[node][1] -= node.work_remaining

        return late_start[node][1]

    # Process each node.
    for node in leaf_nodes:
        _calc_node(node)


# def calc_solo_early_finish(root_nodes, early_finish, now):

#     def _calc_node(node):
#         ef = early_finish.get(node, None)
#         if ef is not None:
#             return ef

#         # Construct tuples of my children's early finishes and their nodes.
#         paths = [[child, _calc_node(child)] for child in node.dependencies.all()]

#         # Take the union of all my children nodes.
#         branch_node_set = set()
#         for path in paths:
#             branch_node_set.union(path[1][0])

#         # Compute the total duration.
#         for node in branch_node_set:
            

#         # Find the earliest start, latest finish and the combined child duration.
#         if paths:
#             min_start = min(paths, key=lambda x: x[1] - x[0].work_remaining)
#             max_finish = max(paths, key=lambda x: x[1])
#             combined_duration = sum([p[0].work_remaining for p in paths], datetime.timedelta(0))
#         else:
#             combined_duration = datetime.timedelta(0)

#         # Use the latest finish of either 1) the earliest child start + combined duration,
#         # 2) the latest child finish or 3) my commencement.
#         if paths:
#             paths = [min_start[1] + combined_duration, max_finish[1]]
#         if node.commencement:
#             paths.append(node.commencement + node.work_remaining)
#         if paths:
#             path = max(paths)
#         else:
#             path = now + node.work_remaining

#         # Add my duration and return.
#         early_finish[node] = path
#         return path

#     # Process each node.
#     for node in root_nodes:
#         _calc_node(node)


# def calc_solo_slack(leaf_nodes, early_finish, branch_size, slack, now):

#     def _calc_node(node):
#         ls = late_start.get(node, None)
#         if ls is not None:
#             return ls[1]

#         # Construct the list of parent slacks.
#         paths = [[parent, _calc_node(parent)] for parent in node.parents.all()]

#         # Build a list of slacks from the parents and their slacks.
#         all_slacks = [
#             datetime.timedelta(seconds=((branch_size[p[0]] - 1)/branch_size[node])*p[1].total_seconds())
#             for p in paths if p[1] is not None
#         ]

#         # If I have a dead line add that in.
#         if node.dead_line:
#             all_slacks.append(node.dead_line - early_finish[node][0])

#         # Take the minimum slack or, if there are no constraints, None.
#         if all_slacks:
#             min_slack = min(all_slacks)
#         else:
#             min_slack = None

#         # Return the slack.
#         slack[node] = min_slack
#         return min_slack

#     # Process each node.
#     for node in leaf_nodes:
#         _calc_node(node)


# def update_effective_fields(user):
#     def _recurse(node, edl):
#         if not node.dead_line or (edl and edl < node.dead_line):
#             node.effective_dead_line = edl
#             node.save()
#         elif node.effective_dead_line is None or node.effective_dead_line != node.dead_line:
#             node.effective_dead_line = node.dead_line
#             node.save()
#         for dep in node.dependencies.all():
#             _recurse(dep, node.effective_dead_line)

#     root_nodes = owned_root_nodes(request.user)

#     for root in root_nodes:
#         if root.effective_dead_line != root.dead_line:
#             root.effective_dead_line = root.dead_line
#             root.save()
#         _recurse(root, root.effective_dead_line)


def update_all(user):
    now = datetime.datetime.now()
    root_nodes = owned_root_nodes(user)
    ewr = {}
    branch_sizes = {}
    etr = {}
    update_effective_work_remaining(root_nodes, ewr)
    update_branch_sizes(root_nodes, branch_sizes)
    update_effective_time_remaining(ewr, branch_sizes, etr, now)
    return etr


def update_effective_work_remaining(root_nodes, eff_work_rem):

    def _recurse(node):

        if node in eff_work_rem:
            return eff_work_rem[node]

        ewr = node.work_remaining
        for child in node.dependencies.all():
            ewr += _recurse(child)
        eff_work_rem[node] = ewr
        return ewr

    for node in root_nodes:
        _recurse(node)


def update_branch_sizes(root_nodes, branch_sizes):

    def _recurse(node, branch_sizes):

        if node in branch_sizes:
            return branch_sizes[node]

        size = 1
        for child in node.dependencies.all():
            size += _recurse(child, branch_sizes)
        branch_sizes[node] = size
        return size

    for node in root_nodes:
        _recurse(node)


# def update_branch_ratios(branch_sizes, branch_ratios):

#     def _recurse(node):

#         if node.pk in done:
#             return node.branch_ratio
#         done.add(node.pk)

#         est = node.estimate
#         for child in node.dependencies.all():
#             est += _recurse(child)
#         node.effective_estimate = est
#         return size + 1

#     for node in branch_sizes.
#         _recurse(node)


def update_effective_time_remaining(eff_work_rem, branch_sizes, eff_time_rem, now):

    def _calc_etr(node):
        etr = eff_time_rem.get(node, None)
        if etr is not None:
            return etr[1]

        # Construct tuples of remaining times tupled with the parent they
        # came from.
        paths = [(parent, _calc_etr(parent)) for parent in node.parents.all()]

        # Add my local time remaining, in case I have a local deadline. This can
        # only be done if I have a deadline.
        if self.dead_line:
            paths.append((None, (self.dead_line - now) - eff_work_rem[node.pk]))

        # Strip out any entries with a None time value. If that leaves nothing then
        # we know that this node has no time restrictions.
        paths.filter(lambda x: x[1] is None)
        if not len(paths):
            eff_time_rem[node] = (None, None)
            return None

        # Find the minimum.
        min_path = min(parent_etrs, lambda x,y: x[1] < y[1])

        # Multiply the minimum time by the branch weight to determine how much
        # of that time belongs to me. If there is no parent then the weight
        # should be one.
        if min_path[0] is not None:
            weight = float(branch_sizes[min_path[0]] - 1)/float(branch_sizes[node])
        else:
            weight = 1.0
        min_path[1] = datetime.timedelta(seconds=min_path[1].total_seconds()*weight)

        eff_time_rem[node] = min_path
        return min_path[1]

    # Process each node.
    for node in eff_work_rem.iterkeys():
        _calc_etr(node)


def save_all(root_nodes):
    done = set()

    def _recurse(node):

        if node.pk in done:
            return
        done.add(node.pk)

        for child in node.dependencies.all():
            _recurse(child)
        node.save()
        return

    for node in root_nodes:
        _recurse(node)


def user_ratings_map(user):
    ratings = user.ratings.all()
    return dict([(r.node.pk, r.rating) for r in ratings])
