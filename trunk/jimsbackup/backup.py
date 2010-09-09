from optparse import OptionParser
import sys, os
from datetime import datetime
##import shutil
import subprocess

from hardlink import hardlink
##from robocopy import mirror
        
def main(root, bmap, history_length=None):
    pattern='bkp-%Y%m%d%H%M%S'
    thisbackup = os.path.join(root, datetime.now().strftime(pattern))
    
    if os.path.exists(os.path.join(root, 'latest.txt')):
        # We have done backups before.  Hardlink to most recent backup.
        with open(os.path.join(root, 'latest.txt'), 'rt') as f:
            mostrecent = os.path.join(root, f.readline().rstrip('\n'))
        print 'Linking "{0}" to "{1}"'.format(mostrecent, thisbackup)
        hardlink(mostrecent, thisbackup)

    # errors = []
    for dest, src in bmap.iteritems():
        print
        print datetime.now(), ' copying "' + src + '" to "' + os.path.join(thisbackup, dest) + '"'
        if os.path.isfile(src):
            r = xcopy_mirror(src, os.path.join(thisbackup, dest))
            # shutil.copy2(src, os.path.join(thisbackup, dest))
            print r[0]
        else:
            r = robocopy_mirror(src, os.path.join(thisbackup, dest))
            print r[0]
            # try:
                # mirror(src, os.path.join(thisbackup, dest))
            # except shutil.Error, err:
                # errors.extend(err)

    with open(os.path.join(root, 'latest.txt'), 'wt') as f:
        f.write(os.path.split(thisbackup)[1] + '\n')

    # if errors:
        # raise shutil.Error, errors
        
def robocopy_mirror(src, dest):
    p = subprocess.Popen(['robocopy',
                          src,
                          dest,
                          '/MIR'],
                          stdout=subprocess.PIPE,
                          stderr=subprocess.PIPE)
    return p.communicate()
    
def xcopy_mirror(src, dest):
    
    if (os.path.exists(dest) and 
        (os.path.getsize(src) == os.path.getsize(dest)) and
        (os.path.getmtime(src) <= os.path.getmtime(dest))):
        # If dest exists and is the same as source -- don't copy.
        return ('', '')
    else:
        p = subprocess.Popen(['xcopy',
                              src,
                              dest,
                              '/V',
                              '/H',
                              '/R',
                              '/K',
                              '/Y',
                              '/Z'],
                             stdin=subprocess.PIPE,
                             stdout=subprocess.PIPE,
                             stderr=subprocess.PIPE)
        p.stdin.write('f/n') # xcopy asks if dest is a file or directory
        return p.communicate()
    
def backup_map_from_file(mappath):
    d = dict()
    with open(mappath, 'rt') as f:
        for line in f:
            source, dest = line.strip('\n').split('|')
            d[os.path.normpath(dest)] = os.path.normpath(source)
    return d

if __name__ == '__main__':
    usage = ("usage: %prog [options] root [source]\n\n" +
             "root      path to the backup root\n" +
             "source    path to source of backup (must be\n" +
             "          provided if --map option is not used)")
    parser = OptionParser(usage=usage)
    parser.add_option("-m", "--map", dest="map_file", metavar="PATH",
                      help="path to the backup map file")
    parser.add_option("-k", "--keep", type="int", dest="history_length",
                      metavar="NUMBER",
                      help="number of backups to keep (oldest are deleted) "
                           "[default: keep all backups]")
    # parser.add_option("-p", "--pattern", default="bkp-%Y%m%d%H%M%S",
                      # help="backup folder pattern [default: %default]")
    (options, args) = parser.parse_args()

    # make sure there are no errors in number/kind of inputs
    if len(args) == 0:
        parser.print_help()
    elif len(args) == 1:
        if not options.map_file:
            raise Exception('Source path or map path not specified!')
    elif len(args) == 2:
        if options.map_file:
            raise Exception('User specified both source path and map path!')
    else:
        raise Exception('Too many arguments specified')

    root = args[0]

    # generate the backup map dictionary (i.e. {relative_dest: source})
    if options.map_file:
        bmap = backup_map_from_file(options.map_file)
    else:
        src = args[1]
        drive, rest = os.path.splitdrive(os.path.abspath(src))
        bmap = {(drive.rstrip(':') + rest): os.path.normpath(src)}

    main(root, bmap, history_length = options.history_length)
    
