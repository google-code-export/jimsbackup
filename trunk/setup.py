import os
from distutils.core import setup
import py2exe

import sys; sys.argv.append('py2exe')

scriptpath = os.path.realpath(__file__)

sys.path.append(os.path.join(os.path.split(scriptpath)[0], 'jimsbackup'))

py2exe_options = dict(
                      excludes=['_ssl',  # Exclude _ssl
                                'pyreadline', 'difflib', 'doctest', 'locale',
                                'pickle', 'calendar'],  # Exclude standard library
                      dll_excludes=['msvcr71.dll'],  # Exclude msvcr71
                      compressed=True,  # Compress library.zip
                      bundle_files=1
                      )

with open(os.path.join(os.path.split(scriptpath)[0], 'VERSION.TXT'), 'rt') as f:
    version = f.readline()


setup(name='JimsBackup',
      version=version,
      description='Common-sense backups on Windows with history',
      author='Jim',

      console=['jimsbackup\\backup.py'],
      options={'py2exe': py2exe_options},
      zipfile=None,
      )
