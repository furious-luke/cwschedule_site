from lightnav.navbar import *


class AccountNav(Nav):
    divide = VerticalDivider()
    login = Link('Log in', 'auth_login', is_logged_in=False)
    sign_up = Link('Sign up', 'registration_register', is_logged_in=False)
    account = Dropdown(
        'Account',
        entries=[
            Entry('Email'),
            Link('Logout', 'auth_logout'),
            HorizontalDivider(is_staff=True),
            Link('Admin', '/admin/', is_staff=True),
        ],
        is_logged_in=True,
    )


class MainNav(Nav):
    manage = Link('Manage', 'manage', is_logged_in=True)
    schedule = Dropdown(
        'Schedulers',
        entries = [
            Entry('Optimal'),
            Entry('Critical path'),
            Entry('Independent'),
        ],
        is_logged_in=True,
    )
    feature = Dropdown(
        'Feature poll',
        entries = [
            Entry('Vote'),
            Entry('Leaderboard'),
        ],
        is_logged_in=True,
    )


class MainNavbar(Navbar):
    brand = 'Clockwork Schedule'
    main_nav = MainNav()
    account_nav = AccountNav(align='right')
