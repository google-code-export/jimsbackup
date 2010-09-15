SETLOCAL
SET /p version=<VERSION.TXT

REM del /f /q jims*.zip
REM del /f /q .\docs\readme.html
rmdir /S /Q build
rmdir /S /Q dist
mkdir build
mkdir build\jimsbackup-%version%
copy .\VERSION.TXT .\build\jimsbackup-%version%\
xcopy /E /I jimsbackup build\jimsbackup-%version%\jimsbackup
mkdir build\jimsbackup-%version%\docs
rst2html.py readme.txt .\build\jimsbackup-%version%\docs\readme.html
cd build
"C:\program files\7-zip\7z" a -tzip ..\dist\jimsbackup-%version%.zip -i!jimsbackup*
cd ..
rmdir /S /Q build