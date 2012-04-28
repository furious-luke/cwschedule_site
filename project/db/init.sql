-- Drop existing objects.
DROP DATABASE cwschedule;
DROP USER cwschedule;

-- Create the user.
CREATE USER cwschedule WITH NOCREATEDB NOCREATEUSER PASSWORD 'cwschedule';

-- Create the database.
CREATE DATABASE cwschedule WITH OWNER cwschedule;
