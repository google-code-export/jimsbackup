jimsBackup
==========

installation
------------

1. Download and install the 
   `Windows 2003 Resource Kit Tools <http://www.microsoft.com/downloads/en/details.aspx?FamilyID=9d467a69-57ff-4ae7-96ee-b18c4790cffd&displaylang=en>`_.
   Make sure that the installation directory is on your 
   `search path <http://ss64.com/nt/path.html>`_.
2. Download and extract `ln.zip <http://schinagl.priv.at/nt/ln/ln.html>`_ to 
   your hard drive. Make sure that the installation directory is on your 
   `search path <http://ss64.com/nt/path.html>`_.
3. Extract the 
   `latest <http://code.google.com/p/jimsbackup/downloads/list?q=label:Featured>`_
   distribution of jimsbackup to your hard drive.

usage
-----

For the following we'll assume you installed jimsbackup to ``C:\jimsbackup``, 
and you want backups to be saved to ``C:\backup``.

Create a backup map file (``C:\backup\backup-map.txt``) that will map backup
sources to destinations.  The file should have one line for each backup
operation.  The lines should contain the absolute path of a file or folder on
your hard drive that you wish to backup, followed by a vertical bar (|),
followed by the relative path of the destination (relative to the backup
folder).  Here is an example:

::

  C:\Documents and Settings\bob\My Documents|Documents and Settings\bob\My Documents
  C:\Documents and Settings\bob\Desktop|Documents and Settings\bob\Desktop

The following command will generate a backup.  Repeating the command will 
generate new backups.  After 20 backups have accumulated creating a new backup
will also delete the oldest backup.

::

  cscript C:\jimsbackup\scripts\backup.js /KEEP:20 /VERBOSE C:\backup\ C:\backup\backup-map.txt>C:\backup\backup.log
