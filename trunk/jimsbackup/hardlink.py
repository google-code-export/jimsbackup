import os
import win32file

class DifferentTypesError(Exception): pass
class SourceDoesntExistError(Exception): pass
class DestExistsError(Exception): pass
class NoRecurseError(Exception): pass
class RecurseError(Exception): pass

def _recursive_hardlink(src, dest):
    for root, dirs, files in os.walk(src):
        newroot = os.path.join(dest, os.path.relpath(root, src))
        if not os.path.exists(newroot):
            os.makedirs(newroot)
        for f in files:
            win32file.CreateHardLink(
                os.path.join(newroot, f),
                os.path.join(root, f))
            
def hardlink(src, dest):
    
    if not os.path.exists(src):
        msg = 'Source path "{0}" does not exist!'.format(src)
        raise SourceDoesntExistError(msg)
    elif os.path.isfile(src):
        if os.path.isdir(dest):
            msg = ('Source "{0}" is a file, and and destination "{1}" is a ' +
                   'directory.  They must be the same type!').format(src, dest)
            raise DifferentTypesError(msg)
        if os.path.exists(dest):
            msg = ('Destination file "{0}" already exists!').format(dest)
            raise DestExistsError(msg)
        win32file.CreateHardLink(dest, src)
    elif os.path.isdir(src):
        if os.path.isfile(dest):
            msg = ('Source "{0}" is a directory, and destination "{1}" ' +
                   'is a file.  They must be the same type!').format(src, dest)
            raise DifferentTypesError(msg)
        _recursive_hardlink(src, dest)
