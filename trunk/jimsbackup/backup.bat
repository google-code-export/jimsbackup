@ECHO OFF
SETLOCAL ENABLEDELAYEDEXPANSION

IF [%1]==[] (
:: No parameters provided -- display usage.
TYPE "%scriptdir%usage.txt"
GOTO:eof
)

:: Set the scriptdir variable to the directory where this script is 
:: located with a trailing slash
SET scriptdir=%~dp0

SET rootdir=%~f1
:: Make sure rootdir ends in a slash (\)
IF NOT %rootdir:~-1% == \ (
SET rootdir=%rootdir%\
)
:: Make sure rootdir exists
IF NOT EXIST %rootdir% (
MKDIR %rootdir%
)

SET mappath=%~f2

SET bkfolder=bk-%date:~6,4%%date:~0,2%%date:~3,2%%time:~0,2%%time:~3,2%%time:~6,2%

DEL /F /Q "%rootdir%backup.log"

IF EXIST "%rootdir%latest.txt" (
:: Apparently we already initialized, make hardlinks to previous 
:: backup.
FOR /F "usebackq delims=" %%G IN ("%rootdir%latest.txt") DO set lastbkfolder=%%G
FOR /F "tokens=1,2 delims=|" %%G IN (%mappath%) DO (call :mk_hardlinks "%rootdir%!lastbkfolder!\%%H" "%rootdir%%bkfolder%\%%H")
)

:: FOR /F "tokens=1,2 delims=|" %%G IN (%mappath%) DO robocopy.exe "%%G" "%rootdir%%bkfolder%\%%H" /V /MIR>>"%rootdir%backup.log"  2>>&1
FOR /F "tokens=1,2 delims=|" %%G IN (%mappath%) DO (CALL :update_contents "%%G" "%rootdir%%bkfolder%\%%H")
@ECHO %bkfolder%>"%rootdir%latest.txt"

:: Delete old backups
IF NOT [%3]==[] (
:: "number-to-keep" parameter provided.  Delete oldest backups that exceed this
:: number.
FOR /F "skip=%3" %%G IN ('dir bk-* /A:D /B /O:-N') DO ECHO rmdir /S /Q %%G
GOTO:eof
)

GOTO:eof

:mk_hardlinks
 IF EXIST %2\NUL (
  :: This is a directory.  Make hard links recursively.
  @ECHO MKDIR %2>>"%rootdir%backup.log"
  MKDIR %2>>"%rootdir%backup.log"
  @ECHO ln.exe Starting @ !date! !time!>>"%rootdir%backup.log"
  @ECHO ln.exe -r %1 %2^>^>"%rootdir%backup.log">>"%rootdir%backup.log"
  ln.exe -r %1 %2>>"%rootdir%backup.log"
  @ECHO ln.exe Finished !date! !time!>>"%rootdir%backup.log"
 ) ELSE (
  :: This is a file.  Just make a hard link to this file.
  @ECHO ln.exe Starting @ !date! !time!>>"%rootdir%backup.log"
  @ECHO ln.exe %1 %2^>^>"%rootdir%backup.log">>"%rootdir%backup.log"
  ln.exe %1 %2>>"%rootdir%backup.log"
 )
 GOTO:eof

:update_contents
	IF EXIST %1\NUL (
		:: This is a directory.
		robocopy.exe "%1" "%2" /V /MIR>>"%rootdir%backup.log"  2>>&1
	) ELSE (
		:: This is a file.
		IF EXIST "%2" (
			:: File exists in destination.
			IF NOT (%~z1) == (%~z2) (
				:: File sizes are not equal.  Force copy of source to dest.
				xcopy "%1" "%2" /V /H /R /K /Y /Z>>"%rootdir%backup.log"  2>>&1
			) ELSE (
				:: File sizes are equal.  Copy if source is newer.
				xcopy "%1" "%2" /D /V /H /R /K /Y /Z>>"%rootdir%backup.log"  2>>&1
			)
		) ELSE (
			:: File does not exist in destination.
			xcopy "%1" "%2" /V /H /R /K /Y /Z>>"%rootdir%backup.log"  2>>&1
		)
	)