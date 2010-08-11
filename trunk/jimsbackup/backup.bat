@ECHO OFF
SETLOCAL ENABLEDELAYEDEXPANSION

REM: Set the scriptdir variable to the directory where this script is 
REM: located with a trailing slash
SET scriptdir=%~dp0

SET rootdir=%~dp1

SET mappath=%~f2

SET bkfolder=bk-%date:~6,4%%date:~0,2%%date:~3,2%%time:~0,2%%time:~3,2%%time:~6,2%

IF [%1]==[] (
REM: No parameters provided -- display usage.
TYPE "%scriptdir%usage.txt"
GOTO end
)

DEL /F /Q "%rootdir%backup.log"

IF EXIST "%rootdir%latest.txt" (
REM: Apparently we already initialized, make hardlinks to previous 
REM: backup.
FOR /F "usebackq delims=" %%G IN ("%rootdir%latest.txt") DO set lastbkfolder=%%G
FOR /F "tokens=1,2 delims=|" %%G IN (%mappath%) DO (call :mk_hardlinks "%rootdir%!lastbkfolder!\%%H" "%rootdir%%bkfolder%\%%H")
)

FOR /F "tokens=1,2 delims=|" %%G IN (%mappath%) DO robocopy.exe "%%G" "%rootdir%%bkfolder%\%%H" /V /MIR>>"%rootdir%backup.log"  2>>&1
@ECHO %bkfolder%>"%rootdir%latest.txt"
GOTO end

:mk_hardlinks
 @ECHO MKDIR %2>>"%rootdir%backup.log"
 MKDIR %2>>"%rootdir%backup.log"
 @ECHO ln.exe Starting @ !date! !time!>>"%rootdir%backup.log"
 @ECHO "%scriptdir%..\bin\ln" -r %1 %2^>^>"%rootdir%backup.log">>"%rootdir%backup.log"
 "ln.exe" -r %1 %2>>"%rootdir%backup.log"
 @ECHO ln.exe Finished !date! !time!>>"%rootdir%backup.log"
 GOTO :eof
 
:end