jimsBackup
**********

On a \*nix system, the best backup solution is to use rsync with the 
--link-dest option.  This is described here 
(http://www.mikerubel.org/computers/rsync_snapshots/) and here 
(http://blog.interlinked.org/tutorials/rsync_time_machine.html).

On Windows, you can use rsync through cygwin, but rsync doesn't handle file
attributes on Windows well.  So you could run rsync, then use the Microsoft tool
robocopy to just update the file attributes, but I would rather use parts that
are designed to work well with Windows.

jimsBackup is a script that utilizes tools that already exist, are free, and are
known to work well on Windows.  These are ln.exe for creating hard links, and
robocopy.exe and xcopy.exe for synchronizing files.  The script is written in
JScript, which will just work on any Windows system, and doesn't require you to
install a script interpreter.  Also included is a simple script for emailing 
backup logs to the backup administrator.

Summary of functionality
========================

Make backups with backup.js
---------------------------

The backup script can be run any number of times to create a new mirror of the
backup sources.  The new mirror is stored in a new folder named bkp-<timestamp>.
First the script uses the ln.exe tool to recreate the directory structure of the
most recent backup, then create hard-links to each of the files in the most
recent backup.  Then robocopy is used to compare the new backup with the
backup directories.  Here, xcopy is used if the backup source is a file instead
of a folder.  Only changed files will be copied to the new backup.  Otherwise, 
the files will be left untouched.

Run backup.js automatically
----------------------------

Use Windows task scheduler to have the backups run on a regular basis.

Why it's awesome
================

Because hard-links are used, this backup script is very efficient with
space, and you should be able to keep many backup folders around.  ln.exe, 
robocopy, and xcopy were built for Windows, so they are fast.  It should only
take a couple of minutes to do backups of several gigabytes of data after 
the initial backup is created.  The backup folders are real mirror copies of the
data at a specific instant in time, they are not stored in a wierd proprietary
format.  As such, they can be browsed, searched, and copied like any other 
folder in Windows using any tools you like to use. 

Special thanks to
=================

 - Hermann Schinagl -- for his ln.exe tool 
   (http://schinagl.priv.at/nt/ln/ln.html).  It's better than the 
   Microsoft tool fsutil, since it can make hard links on network 
   drives.
