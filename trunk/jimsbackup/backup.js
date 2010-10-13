/* JimsBackup

   To view usage, run:  cscript backup.js
	 
   Requirements:
     * Microsoft Windows XP
	 * NTFS-formatted drive for backup root
     * robocopy.exe (Windows Server 2003 Resource Kit Tools)
	 * ln.exe (http://schinagl.priv.at/nt/ln/ln.html)
*/

/* Copyright (c) 2010, James Cook, University of Pittsburgh
   All rights reserved.

   Redistribution and use in source and binary forms, with or without 
   modification, are permitted provided that the following conditions are met:

       * Redistributions of source code must retain the above copyright notice,
		 this list of conditions and the following disclaimer.
       * Redistributions in binary form must reproduce the above copyright 
	     notice, this list of conditions and the following disclaimer in the 
		 documentation and/or other materials provided with the distribution.
       * Neither the name of the University of Pittsburgh nor the names of its 
	     contributors may be used to endorse or promote products derived from 
		 this software without specific prior written permission.

   THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
   AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE 
   IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE 
   ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE
   LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR 
   CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF 
   SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS 
   INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN 
   CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) 
   ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE 
   POSSIBILITY OF SUCH DAMAGE.
*/

var opts = WScript.Arguments.Named;
var args = WScript.Arguments.Unnamed;
var fso = new ActiveXObject('Scripting.FileSystemObject');
var wshShell = WScript.CreateObject('WScript.Shell');

// temporary variables
var cmd; // used for running shell commands
var rtn; // used to hold value returned from shell command
var msg; // used for creating messages to echo
var tmp; // general purpose temporary variable
var f; // general purpose temporary file object

// constants used by the OpenTextFile method of the FileSystemObject
var ForReading = 1;
var ForWriting = 2;

var name = 'JimsBackup';
var version = '';
var versionFileName;
var versionFile;
var consoleWidth = 80; // number of chars in width of console window
var rootFolderPath;
var mapFilePath;
var mapFile;
var bkFolder;
var bkFolderName;
var bkFolderPath;
var latestFilePath; // path to latest.txt file in rootFolderPath
var latestFile;
var firstBackup;
var linkFolderPath; // path to previous backup that this one will link to
var linkDest;
var ts = new Date(); // start time (date object)
var srcPath; // source file/directory of a backup operation
var destPath; // destination of a backup operation relative to bkFolderPath
var scriptFolderName = fso.GetParentFolderName(WScript.ScriptFullName);
var verbose;
var bkDrive;
var bkDriveSpaceStart;
var bkDriveSpaceEnd;

if (opts.Exists('verbose'))
	verbose = true;
else
	verbose = false;

if (!IsHostCscript())
{
	msg = 'Please run this script using CScript.\n';
	msg += 'This can be achieved by\n';
	msg += '1. Using "CScript script.vbs arguments" or\n';
	msg += '2. Changing the default Windows Scripting Host to CScript\n';
	msg += '   using "CScript //H:CScript //S" and running the script\n';
	msg += '   "script.vbs arguments".';
	WScript.Echo(msg);
	WScript.Quit(1);
}

versionFileName = fso.BuildPath(fso.BuildPath(scriptFolderName, '..'), 'VERSION.TXT');
if (fso.FileExists(versionFileName))
{
	versionFile = fso.OpenTextFile(versionFileName, ForReading, false);
	version = versionFile.ReadLine();
	versionFile.close();
}

if (verbose)
{
	if (version == '')
	{
		WScript.Echo(name);
		WScript.Echo(Date());
		WScript.Echo();
	}
	else
	{
		WScript.Echo(name + ' ' + version);
		WScript.Echo(Date());
		WScript.Echo();
	}
}

if (args.length < 2)
{
	ShowUsage()
	WScript.Quit(1);
}
	
rootFolderPath = fso.GetAbsolutePathName(args(0));
if (verbose)
	WScript.Echo('Root Folder:  "' + rootFolderPath + '"');

bkDrive = fso.GetDrive(fso.GetDriveName(fso.GetAbsolutePathName(rootFolderPath)));
bkDriveSpaceStart = bkDrive.FreeSpace;
	
if (!fso.FolderExists(rootFolderPath))
{
	if (verbose)
		WScript.Echo('  Root folder does not exist.  Creating it...');
	cmd = 'cmd /c mkdir "' + rootFolderPath + '"';
	rtn = wshShell.run(cmd, 0, true);
	if (!fso.FolderExists(rootFolderPath))
	{
		WScript.Echo('  Error trying to create root folder!');
		WScript.Quit(1);
	}
	else
	{
		if (verbose)
			WScript.Echo('  Root folder created successfully.');
	}
}	
	
bkFolderName = 'bkp-';
bkFolderName += ts.getYear();
bkFolderName += ('0' + (ts.getMonth() + 1)).slice(-2);
bkFolderName += ('0' + ts.getDate()).slice(-2);
bkFolderName += ('0' + ts.getHours()).slice(-2);
bkFolderName += ('0' + ts.getMinutes()).slice(-2);
bkFolderName += ('0' + ts.getSeconds()).slice(-2);

bkFolderPath = fso.BuildPath(rootFolderPath, bkFolderName);

if (verbose)
	WScript.Echo('Backup path:  "' + bkFolderPath + '"');

latestFilePath = fso.BuildPath(rootFolderPath, "latest.txt");
firstBackup = !fso.FileExists(latestFilePath);
if (!firstBackup)
{
	msg = 'Found latest.txt file at ';
	msg += '"' + fso.BuildPath(rootFolderPath, "latest.txt") + '"';
	msg += '. Reading most recent previous backup...';
	if (verbose)
		WScript.Echo(msg);
	
	latestFile = fso.OpenTextFile(latestFilePath, ForReading, false);
	linkFolderPath = fso.BuildPath(rootFolderPath, latestFile.ReadLine());
	latestFile.close()
	if (verbose)
		WScript.Echo('  Most recent previous backup:  "' + linkFolderPath + '"');
}
else
{
	if (verbose)
		WScript.Echo('latest.txt file not found.  This must be the first backup.');
}

mapFilePath = fso.GetAbsolutePathName(args(1));
if (verbose)
	WScript.Echo('Map path:  "' + mapFilePath + '"');
	
if (!fso.FileExists(mapFilePath))
{
	WScript.Echo('Map file does not exist!');
	WScript.Quit(1);
}

if (opts.Exists('keep'))
{
	if (isNaN(parseInt(opts('keep'))))
	{
		msg = 'Must assign an integer to KEEP option. ';
		msg += opts('keep') + ' provided.'
		WScript.Echo(msg)
		WScript.Quit(1);
	}
	if (verbose)
		WScript.Echo('Number of backups to keep:  ' + opts('keep'));
}

if (opts.Exists('verbose'))
{
	if (verbose)
		WScript.Echo('Verbose option turned on.');
}


if (verbose)
{
	WScript.Echo();
	WScript.Echo('Starting backup operations...');
}

if (!fso.FolderExists(bkFolderPath))
{
	// Backup folder must exist for ln.exe to work!
	bkFolder = fso.CreateFolder(bkFolderPath);
}

mapFile = fso.OpenTextFile(mapFilePath, ForReading, false);
while (!mapFile.AtEndOfStream)
{
	tmp = mapFile.ReadLine().split('|');
	srcPath = tmp[0];
	destPath = fso.BuildPath(bkFolderPath, tmp[1]);
	if (verbose)
	{
		WScript.Echo();
		WScript.Echo('backup from: ' + srcPath);
		WScript.Echo('backup to: ' + destPath);
	}
	
	if (!firstBackup)
	{
		linkDest = fso.BuildPath(linkFolderPath, tmp[1]);
		if (fso.FolderExists(linkDest))
		{
			msg = 'Previous backup ';
			msg += '"' + linkDest + '"';
			msg += ' exists and is a folder -- recursively linking contents to ';
			msg += '"' + linkDest + '"...';
			if (verbose)
				WScript.Echo(msg);
			link(linkDest, destPath, true, verbose);
		}
		else if (fso.FileExists(linkDest))
		{
			msg = 'Previous backup ';
			msg += '"' + linkDest + '"';
			msg += ' exists -- linking to ';
			msg += '"' + linkDest + '"...';
			if (verbose)
				WScript.Echo(msg);
			link(linkDest, destPath, false, verbose);
		}
		else
		{
			msg = '"' + linkDest + '"';
			msg += ' does not exist -- no hard links will be created.';
			if (verbose)
				WScript.Echo(msg);
		}
	}
	
	if (fso.FolderExists(srcPath))
	{
		msg = 'Source folder ';
		msg += '"' + srcPath + '"';
		msg += ' exists -- recursively synchronizing contents to ';
		msg += '"' + destPath + '"...';
		if (verbose)
			WScript.Echo(msg);
		synchronize(srcPath, destPath, verbose);
	}
	else if (fso.FileExists(srcPath))
	{
		msg = 'Source file ';
		msg += '"' + srcPath + '"';
		msg += ' exists -- synchronizing to ';
		msg += '"' + destPath + '"...';
		if (verbose)
			WScript.Echo(msg);
		synchronize(srcPath, destPath, verbose);
	}
	else
	{
		msg = 'Source path ';
		msg += '"' + srcPath + '"';
		msg += ' does not exist!  Nothing will be copied.';
		WScript.Echo(msg);
	}
	
}

if (verbose)
{
	WScript.Echo();
	WScript.Echo('All backup operations completed.');
	WScript.Echo(Date());
}

latestFile = fso.OpenTextFile(latestFilePath, ForWriting, true);
latestFile.WriteLine(bkFolderName);
latestFile.Close()
if (verbose)
{
	WScript.Echo();
	WScript.Echo('latest.txt updated.');
}
	
if (opts.Exists('KEEP'))
{
	if (verbose)
		WScript.Echo();
	removeOldest(rootFolderPath, parseInt(opts('KEEP')), verbose);
}

bkDriveSpaceEnd = bkDrive.FreeSpace;

if (verbose)
{
	WScript.Echo();
	WScript.Echo('Free space before backup: ' + bkDriveSpaceStart);
	WScript.Echo('Free space after backup:  ' + bkDriveSpaceEnd);
	WScript.Echo('Difference: ' + (bkDriveSpaceEnd - bkDriveSpaceStart));
}

function removeOldest(root, nKeep, verbose)
{
	var fso = new ActiveXObject('Scripting.FileSystemObject');
	var folders = listBackups(root).sort();
	var deleteFolders = folders.slice(0, folders.length-nKeep);
	var keepFolders = folders.slice(folders.length-nKeep,folders.length);
	var folderPath;
	if (verbose)
	{
		WScript.Echo('Found ' + folders.length + ' backup folders.');
		if (deleteFolders.length > 0)
		{
			WScript.Echo(deleteFolders.length + ' will be deleted:');
			for (var i in deleteFolders)
			{
				WScript.Echo('  ' + deleteFolders[i]);
			}
		}
		WScript.Echo(keepFolders.length + ' will be kept:');
		for (var i in keepFolders)
		{
			WScript.Echo('  ' + keepFolders[i]);
		}
		if (deleteFolders.length > 0)
			WScript.Echo('Removing old backups...');
	}
	for (var i in deleteFolders)
	{
		folderPath = fso.BuildPath(root, deleteFolders[i]);
		fso.DeleteFolder(folderPath, true);
		if (verbose)
			WScript.Echo('  deleted "' + folderPath + '"');
	}
}

function listBackups(root)
{
	var cmd;
	cmd = 'cmd /c dir /a:d /b ';
	cmd += '"' + fso.BuildPath(root, 'bkp-*') + '"';
	var oExec = wshShell.Exec(cmd);
	var folders = new Array();
	while (oExec.Status == 0)
	{
		WScript.Sleep(100);
	}
	while (!oExec.stdOut.AtEndOfStream)
	{
		folders.push(oExec.stdOut.ReadLine());
	}
	return folders;
}

function link(src, dest)
{
	// Arguments:
	//   src		existing file or folder to link from
	//   dest		new file or folder
	//   [recurse]  recurse sub-directories if src is a folder
	//   [verbose]  display verbose output (default false)
	
	var fso = new ActiveXObject('Scripting.FileSystemObject');
	var cmd = '';
	var msg;
	var recurse;
	var verbose;
	
	if (arguments.length >= 4)
		verbose = arguments[3];
	else
		verbose = false;
	
	if (arguments.length >= 3)
		recurse = arguments[2];
	else
		recurse = false;
	
	if (fso.FolderExists(src) & recurse)
	{
		cmd = 'cmd /c ln -r ';
		cmd += '"' + src + '" ';
		cmd += '"' + dest + '"';
	}
	else if (fso.FileExists(src))
	{
		cmd = 'cmd /c ln ';
		cmd += '"' + src + '" ';
		cmd += '"' + dest + '"';
	}
	else
	{
		msg = 'Error creating hard links! ';
		msg += '"' + src + '"';
		msg += ' does not exist.';
		WScript.Echo(msg);
		WScript.Quit(1);
	}
	runCommand(cmd, verbose)
}

function synchronize(src, dest)
{
	// Arguments:
	//   src		existing file or folder to sync from
	//   dest		new or existing file or folder to sync to
	//   [verbose]  display verbose output (default false)
	
	var fso = new ActiveXObject('Scripting.FileSystemObject');
	var wshShell = WScript.CreateObject('WScript.Shell');
	var cmd;
	var msg;
	var tempResult;
	var verbose;
	
	if (arguments.length == 3)
		verbose = arguments[2];
	else
		verbose = false;
	
	var ForReading = 1;
	
	if (fso.FolderExists(src))
	{
		//For folder copy -- use robocopy
		var tempFolderPath = wshShell.ExpandEnvironmentStrings('%TEMP%');
		var tempFilePath = fso.BuildPath(tempFolderPath, fso.GetTempName());
		var tempFile;
		
		cmd = 'cmd /c robocopy ';
		cmd += '"' + src + '" ';
		cmd += '"' + dest + '" ';
		cmd += '/MIR /LOG:';
		cmd += '"' + tempFilePath + '"';
		runCommand(cmd, verbose);
		tempFile = fso.OpenTextFile(tempFilePath, ForReading);
		while (!tempFile.AtEndOfStream)
		{
			tempResult = tempFile.ReadLine()
			if (verbose)
			{
				WScript.Echo('  ' + tempResult);
			}
		}
		tempFile.close();
	}
	else if (fso.FileExists(src))
	{
		//For file copy -- use xcopy
		var destExists = fso.FileExists(dest);
		var equalSize
		var sourceNewer
		var doCopy = false
		
		if (destExists)
		{
			equalSize = fso.GetFile(src).Size == fso.GetFile(dest).size;
			sourceNewer = fso.GetFile(src).DateLastModified > fso.GetFile(dest).DateLastModified;
			if (!equalSize | sourceNewer)
				doCopy = true;
		}
		else
			doCopy = true;
		
		if (doCopy)
		{
			cmd = 'cmd /c echo f|xcopy';
			cmd += ' "' + src + '"';
			cmd += ' "' + dest + '"';
			cmd += ' /V /H /R /K /Y /Z';
			runCommand(cmd, verbose)
		}
		else
		{
			if (verbose)
			{
				WScript.Echo('  Files appear to be the same -- no copy done.');
			}
		}
	}
	else
	{
		msg = 'Error synchronizing files ';
		msg += '"' + src + '"';
		msg += ' does not exist.';
		WScript.Echo(msg);
		WScript.Quit(1);
	}

}

function runCommand(cmd)
{
	// Arguments:
	//   cmd		shell command to run
	//   [verbose]  display verbose output (default false)
	
	var verbose;
	var tempResult = '';
	if (arguments.length == 2)
		verbose = arguments[1];
	else
		verbose = false;
		
	var wshShell = WScript.CreateObject('WScript.Shell');
	if (verbose)
	{
		WScript.Echo('Running Command:');
		WScript.Echo('  ' + cmd);
	}
	var oExec = wshShell.Exec(cmd);

	if (verbose)
	{
		WScript.Echo('Result:');
	}
	
	while (oExec.Status == 0)
	{
		WScript.Sleep(100);
		while (!oExec.stdOut.AtEndOfStream)
		{
			tempResult = oExec.stdOut.ReadLine();
			if (verbose)
				WScript.Echo('  ' + tempResult);
		}
	}
	
	if (oExec.ExitCode != 0)
	{
		WScript.Echo('There was an error running the following command:');
		WScript.Echo(cmd);
	}
}

function IsHostCscript()
{
	var strFullName;
	var strCommand;
	var i, j;
	
	strFullName = WScript.FullName;
	i = strFullName.indexOf('.exe');
	if (i != -1)
	{
		j = strFullName.lastIndexOf('\\', i);
		if (j != 0)
		{
			strCommand = strFullName.slice(j+1, i);
			if (strCommand.toLowerCase() == 'cscript')
			{
				return true
			}
		}
	}
	return false
}

function ShowUsage()
{
	var usage;
	usage =  'Usage: cscript backup.js [/KEEP:number] [/VERBOSE] root mapfile\n';
	usage += '\n';
	usage += 'Options:\n'
	usage += '  root          root directory for backups\n';
	usage += '  mapfile       file that maps sources to destinations for a backup session\n';
	usage += '  /KEEP:number  number of backups to keep; oldest will be deleted\n';
	usage += '                (default is to keep everything)\n';
	usage += '  /VERBOSE      display verbose output (default is to display nothing)\n';
	usage += '\n';
	usage += 'MapFile\n';
	usage += '=======\n';
	usage += '\n';
	usage += 'Syntax:\n'
	usage += '  The mapfile contains a list of backup source directories and\n';
	usage += '  destination directories separated by bars (|).  The destination\n';
	usage += '  directories are relative to the backup folder.  Source directories are\n';
	usage += '  absolute paths.\n';
	usage += '\n';
	usage += 'Example:\n';
	usage += '  C:\\web\\|web\\\n';
	usage += '  C:\\temp\\|temp\\\n';
	usage += '  D:\\data\\|data\\\n';
	WScript.Echo(usage);
}
