/* Usage: cscript email.js [
/USER:email_address  username@gmail.com
/PASS:password       gmail password
/SUB:subject         email subject
/RT:email_address    reply-to email address
/FROM:email_address  from email address
/TO:email_address    to email address
/BF:filename		 filename for message body
*/

var opts = WScript.Arguments.Named;
var args = WScript.Arguments.Unnamed;
var fso = new ActiveXObject("Scripting.FileSystemObject");
var email = WScript.CreateObject('CDO.Message');

if (!IsHostCscript())
{
	msg = 'Please run this script using CScript.\n';
	msg += 'This can be achieved by\n';
	msg += '1. Using "CScript sendgmail.js arguments" or\n';
	msg += '2. Changing the default Windows Scripting Host to CScript\n';
	msg += '   using "CScript //H:CScript //S" and running the script\n';
	msg += '   "script.vbs arguments".';
	WScript.Echo(msg);
	WScript.Quit(1);
}

if (opts.length == 0)
{
	ShowUsage();
	WScript.Quit(0);
}

// Constants to use with fso.OpenTextFile:
var ForReading = 1
var ForWriting = 2

email.Configuration.Fields.Item("http://schemas.microsoft.com/cdo/configuration/sendusing") = 2;
email.Configuration.Fields.Item("http://schemas.microsoft.com/cdo/configuration/smtpserver") = "smtp.gmail.com";
email.Configuration.Fields.Item("http://schemas.microsoft.com/cdo/configuration/smtpserverport") = 465;
email.Configuration.Fields.Item("http://schemas.microsoft.com/cdo/configuration/smtpauthenticate") = 1;
email.Configuration.Fields.Item("http://schemas.microsoft.com/cdo/configuration/smtpusessl") = 1;

if (opts.Exists('USER'))
	email.Configuration.Fields.Item("http://schemas.microsoft.com/cdo/configuration/sendusername") = opts('USER');

if (opts.Exists('PASS'))
	email.Configuration.Fields.Item("http://schemas.microsoft.com/cdo/configuration/sendpassword") = opts('PASS');
	
if (opts.Exists('SUB'))
	email.Subject = opts('SUB');
	
if (opts.Exists('RT'))
	email.ReplyTo = opts('RT');
	
if (opts.Exists('FROM'))
	email.From = opts('FROM');
	
if (opts.Exists('TO'))
	email.To = opts('TO');
	
if (opts.Exists('BF'))
{
	var f = fso.OpenTextFile(opts('BF'), ForReading);
	email.TextBody = f.ReadAll();
	f.close();
}

/* Use this to get body from standard input.
var body = '';
while (!WScript.StdIn.AtEndOfStream)
{
	body += WScript.StdIn.ReadLine() + '\n';
}
*/

email.Configuration.Fields.Update();
email.Send();
email = null;

function ShowUsage()
{
	var usage;
	usage =  'Send email via gmail and CDO Messaging library\n';
	usage += '\n';
	usage +=  'Usage: cscript sendgmail.js [OPTIONS]\n';
	usage += '\n';
	usage += 'Options:\n';
	usage += '  /USER:email_address  username@gmail.com\n';
	usage += '  /PASS:password       gmail password\n';
	usage += '  /SUB:subject         email subject\n';
	usage += '  /RT:email_address    reply-to email address\n';
	usage += '  /FROM:email_address  from email address\n';
	usage += '  /TO:email_address    to email address\n';
	usage += '  /BF:filename         filename for message body\n';
	WScript.Echo(usage);
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