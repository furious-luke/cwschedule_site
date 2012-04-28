Here we have some scripts to help manipulate sql databases. To
execute them using postgresql you can run:

  sudo -u postgres psql -f <script>

The available scripts are:

  init.sql
    Initialise a database and user. CAUTION! This will delete
    any existing database and user!
