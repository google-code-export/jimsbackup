Jim's Backup Script
*******************

This is the best thing I can come up with for a backup solution on 
Windows.  On a \*nix system, the best solution is to use rsync with the 
--link-dest option.  This is described here 
(http://www.mikerubel.org/computers/rsync_snapshots/) and here 
(http://blog.interlinked.org/tutorials/rsync_time_machine.html).

Summary of functionality
========================

Initalize with backup-init.bat
------------------------------

The backup must be initialized first by doing a robocopy to copy the 
backup directories to a backup folder named bk-<timestamp>.  Robocopy is
nice because it creates a mirror of the backup directories instead of
storing the directory info in a proprietary format (i.e. like ntbackup).
Here, you could also use xcopy.  The name of the backup folder should be
stored in a file called latest.txt, so that in the future, it's easy for
the backup script to determine which backup folder is the most 
up-to-date.

Make subsequent backups with backup.bat
---------------------------------------

Now that the backup is initialized, the backup script can be run any 
number of times to create a new mirror of the backup directories.  The 
new mirror is stored in a new folder named bk-<timestamp>.  First the 
script uses the ln.exe tool to recreate the directory structure of the
latest backup, then create hard-links to each of the files in the most
recent backup.  Then robocopy is used to compare the new backup with the
backup directories.  Any changed files will be copied to the new backup.
Otherwise, the files will be left untouched.

The script also makes sure that you don't make too many backups.  You 
can specify the number of backups to keep in the FOR... line (i.e. 
skip=N).  Then whenever you run the script, it will keeep the most 
recent N backups that you specify and delete the old ones.

Run backup.bat automatically
----------------------------

Use Windows task scheduler to have the backups run on a regular basis.

Why it's awesome
================

Because hard-links are used, this backup script is very efficient with
space, and you should be able to keep many backup folders around (maybe
30 days of history would be good).  ln.exe and robocopy were built for 
Windows, so they are fast.  It should only take a couple of minutes to 
do backups of several gigabytes of date after initializiation.  The 
backup folders are real mirror copies of the data at a specific instant
in time, they are not stored in a wierd proprietary format.  As such, 
they can be browsed, searched, and copied like any other folder in 
Windows using any tools you like to use. 

How could this get any better?
==============================

You can't make volume shadow copies as a non-admin on Windows.  Since we
use UPMC computers, we don't have admin accounts.  Shadow copies allow
robocopy to copy files that are open by other programs.  If you could
incorporate the use of volume shadow copies in the script, it would be
better.

Special thanks to
=================

 - Hermann Schinagl -- for his ln.exe tool 
   (http://schinagl.priv.at/nt/ln/ln.html).  It's better than the 
   Microsoft tool fsutil, since it can make hard links on network 
   drives.