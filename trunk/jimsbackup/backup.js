var name = 'JimsBackup';
var version;
var versionFileName;
var versionFile;
var consoleWidth = 80; // number of chars in width of console window
var rootFolderPath;
var mapFilePath;
var mapFile;
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

// constants used by the OpenTextFile method of the FileSystemObject
var ForReading = 1;
var ForWriting = 2;

// temporary variables
var cmd; // used for running shell commands
var rtn; // used to hold value returned from shell command
var msg; // used for creating messages to echo
var tmp; // general purpose temporary variable
var f; // general purpose temporary file object

var args = WScript.Arguments;
var fso = new ActiveXObject('Scripting.FileSystemObject');
var scriptFolderName = fso.GetParentFolderName(WScript.ScriptFullName);
var wshShell = WScript.CreateObject('WScript.Shell');

if (args.length < 2)
{
	WScript.Echo('Need at least two arguments!  Usage information here!');
	WScript.Quit(1);
}

versionFileName = fso.BuildPath(fso.BuildPath(scriptFolderName, '..'), 'VERSION.TXT');
if (fso.FileExists(versionFileName))
{
	versionFile = fso.OpenTextFile(versionFileName, ForReading, false);
	version = versionFile.ReadLine();
	versionFile.close();
	WScript.Echo(name + ' Version ' + version);
}
else
	WScript.Echo(name);

rootFolderPath = fso.GetAbsolutePathName(args(0));
WScript.Echo();
WScript.Echo('Root Folder:  "' + rootFolderPath + '"');

bkFolderName = 'bkp-';
bkFolderName += ts.getYear();
bkFolderName += ('0' + (ts.getMonth() + 1)).slice(-2);
bkFolderName += ('0' + ts.getDate()).slice(-2);
bkFolderName += ('0' + ts.getHours()).slice(-2);
bkFolderName += ('0' + ts.getMinutes()).slice(-2);
bkFolderName += ('0' + ts.getSeconds()).slice(-2);

bkFolderPath = fso.BuildPath(rootFolderPath, bkFolderName);
WScript.Echo();
WScript.Echo('Backup path:  "' + bkFolderPath + '"');

if (!fso.FolderExists(rootFolderPath))
{
	WScript.Echo('Root folder does not exist.  Creating it...');
	cmd = 'cmd /c mkdir "' + rootFolderPath + '"';
	rtn = wshShell.run(cmd, 0, true);
	if (!fso.FolderExists(rootFolderPath))
	{
		WScript.Echo('Error trying to create root folder!');
		WScript.Quit(1);
	}
	else
		WScript.Echo('Root folder created successfully.');
}

latestFilePath = fso.BuildPath(rootFolderPath, "latest.txt");
firstBackup = !fso.FileExists(latestFilePath);

if (!firstBackup)
{
	WScript.Echo();
	msg = 'Found latest.txt file at ';
	msg += '"' + fso.BuildPath(rootFolderPath, "latest.txt") + '"';
	msg += '. Reading most recent previous backup...';
	WScript.Echo(msg);
	
	latestFile = fso.OpenTextFile(latestFilePath, ForReading, false);
	linkFolderPath = fso.BuildPath(rootFolderPath, latestFile.ReadLine());
	latestFile.close()
	WScript.Echo('Most recent previous backup:  "' + linkFolderPath + '"');
}
else
{
	WScript.Echo()
	WScript.Echo('latest.txt file not found.  This must be the first backup.');
}

mapFilePath = fso.GetAbsolutePathName(args(1));
WScript.Echo();
WScript.Echo('Map path:  "' + mapFilePath + '"');
if (!fso.FileExists(mapFilePath))
{
	WScript.Echo('Map file does not exist!');
	WScript.Quit(1);
}

mapFile = fso.OpenTextFile(mapFilePath, ForReading, false);
while (!mapFile.AtEndOfStream)
{
	tmp = mapFile.ReadLine().split('|');
	srcPath = tmp[0];
	destPath = fso.BuildPath(bkFolderPath, tmp[1]);
	WScript.Echo();
	WScript.Echo('backup from: ' + srcPath);
	WScript.Echo('backup to: ' + destPath);
	
	if (!firstBackup)
	{
		linkDest = fso.BuildPath(linkFolderPath, tmp[1]);
		if (fso.FolderExists(linkDest))
		{
			msg = 'Previous backup ';
			msg += '"' + linkDest + '"';
			msg += ' exists and is a folder -- recursively linking contents to ';
			msg += '"' + linkDest + '"...';
			WScript.Echo(msg);
			link(linkDest, destPath, true);
		}
		else if (fso.FileExists(linkDest))
		{
			msg = 'Previous backup ';
			msg += '"' + linkDest + '"';
			msg += ' exists -- linking to ';
			msg += '"' + linkDest + '"...';
			WScript.Echo(msg);
			link(linkDest, destPath);
		}
		else
		{
			msg = '"' + linkDest + '"';
			msg += ' does not exist -- no hard links will be created.';
			WScript.Echo(msg);
		}
	}
	
	if (fso.FolderExists(srcPath))
	{
		msg = 'Source folder ';
		msg += '"' + srcPath + '"';
		msg += ' exists -- recursively synchronizing contents to ';
		msg += '"' + destPath + '"...';
		WScript.Echo(msg);
		synchronize(srcPath, destPath);
	}
	else if (fso.FileExists(srcPath))
	{
		msg = 'Source file ';
		msg += '"' + srcPath + '"';
		msg += ' exists -- synchronizing to ';
		msg += '"' + destPath + '"...';
		WScript.Echo(msg);
		synchronize(srcPath, destPath);
	}
	else
	{
		msg = 'Source path ';
		msg += '"' + srcPath + '"';
		msg += ' does not exist!  Nothing will be copied.';
		WScript.Echo(msg);
	}
	
}

WScript.Echo();
WScript.Echo('Finished backing up all files!');
WScript.Echo(Date());

// WScript.Echo();
// WScript.Echo('Updated latest.txt to point to this backup...');
// latestFile = fso.OpenTextFile(latestFilePath, ForWriting, true);
// latestFile.WriteLine(bkFolderName);
// latestFile.Close()

if (args.length == 3)
{
	nKeep = args(2);
	removeOldest(rootFolderPath, nKeep);	
}



function removeOldest(root, nKeep)
{
	var fso = new ActiveXObject('Scripting.FileSystemObject');
	var cmd;
	cmd = 'cmd /c dir /a:d /b /o:-n ';
	cmd += '"' + fso.BuildPath(root, 'bkp-*') + '"';
	var oExec = wshShell.Exec(cmd);
	var folderName, folderPath;
	var count = 0;
	while (oExec.Status == 0)
	{
		WScript.Sleep(100);
	}
	while (!oExec.stdOut.AtEndOfStream)
	{
		folderName = oExec.stdOut.ReadLine();
		count++;
		if (count > nKeep)
		{
			folderPath = fso.BuildPath(root, folderName);
			fso.DeleteFolder(folderPath, true);
		}
	}
}

function link(src, dest)
{
	// Arguments:
	//   src		existing file or folder to link from
	//   dest		new file or folder
	//   [recurse]  recurse sub-directories if src is a folder
	
	var fso = new ActiveXObject('Scripting.FileSystemObject');
	var cmd = '';
	var msg;
	var recurse = false;
	
	if (arguments.length == 3)
		recurse = arguments[2];
	
	WScript.Echo('RECURSE = ' + recurse);
	
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
	runCommand(cmd)
}

function synchronize(src, dest)
{
	var fso = new ActiveXObject('Scripting.FileSystemObject');
	var wshShell = WScript.CreateObject('WScript.Shell');
	var cmd;
	var msg;
	
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
		runCommand(cmd);
		tempFile = fso.OpenTextFile(tempFilePath, ForReading);
		while (!tempFile.AtEndOfStream)
			WScript.Echo(tempFile.ReadLine());
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
			runCommand(cmd)
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
	// Wscript.Echo "Running command:"
	// Wscript.Echo cmd
	// Wscript.Echo
	var wshShell = WScript.CreateObject('WScript.Shell');
	var oExec = wshShell.Exec(cmd);
	// Dim WshShell, oExec
	// Set WshShell = CreateObject("WScript.Shell")
	// Set oExec = WshShell.Exec(cmd)

	while (oExec.Status == 0)
	{
		WScript.Sleep(100);
		while (!oExec.stdOut.AtEndOfStream)
		{
			WScript.Echo(oExec.stdOut.ReadLine());
		}
	}
	
	if (oExec.ExitCode != 0)
	{
		WScript.Echo('There was an error running the following command:');
		WScript.Echo(cmd);
	}
	
	// Do While oExec.Status = 0
		 // WScript.Sleep 100
		 // Do While oExec.stdOut.AtEndOfStream <> True
			// Wscript.Echo oExec.stdOut.ReadLine
		 // Loop
	// Loop

	// If oExec.ExitCode <> 0 Then
		// Wscript.Echo "There was an error running the following command."
		// Wscript.Echo cmd
	// End If
}