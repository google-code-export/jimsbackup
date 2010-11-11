SETLOCAL
SET /p version=<VERSION.TXT

REM del /f /q jims*.zip
REM del /f /q .\docs\readme.html
rmdir /S /Q build
rmdir /S /Q dist
mkdir build
mkdir build\jimsbackup
copy .\VERSION.TXT .\build\jimsbackup\
xcopy /E /I jimsbackup build\jimsbackup\scripts /EXCLUDE:.\setup.excludes
mkdir build\jimsbackup\docs
rst2html.py readme.txt .\build\jimsbackup\docs\readme.html
cd build
"C:\program files\7-zip\7z" a -tzip ..\dist\jimsbackup-%version%.zip -i!jimsbackup*
cd ..
rmdir /S /Q build