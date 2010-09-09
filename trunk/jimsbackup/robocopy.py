import os, filecmp, shutil

def mirror(src, dest):
    if os.path.exists(dest):
        comp = filecmp.dircmp(src, dest)
        _mirror(comp)
    else:
        shutil.copytree(src, dest)

def _mirror(comp):
    for subcomp in comp.subdirs.itervalues():
        _mirror(subcomp)
    # For files only in source -- copy to dest.
    for f in comp.left_only:
        print 'processing source-only file: "{0}"'.format(os.path.join(comp.left, f))
        if os.path.isdir(os.path.join(comp.left, f)):
            print 'left only directory'
            shutil.copytree(os.path.join(comp.left, f), os.path.join(comp.right, f))
        else:
            print 'left only file'
            shutil.copy2(os.path.join(comp.left, f), os.path.join(comp.right, f))
    # For files only in dest -- delete them.
    for f in comp.right_only:
        print 'processing dest-only file: "{0}"'.format(os.path.join(comp.right, f))
        if os.path.isdir(os.path.join(comp.right, f)):
            'right only directory'
            shutil.rmtree(os.path.join(comp.right, f))
        else:
            'right only file'
            os.remove(os.path.join(comp.right, f))
    # For common files -- copy to dest if they have different contents.
    for f in comp.common:
        if not os.path.isdir(os.path.join(comp.left, f)):
            print 'processing common file: "{0}"'.format(os.path.join(comp.left, f))
            st_left = os.stat(os.path.join(comp.left, f))
            st_right = os.stat(os.path.join(comp.right, f))
            # If source is newer or if contents are different -- copy to dest.
            if st_left.st_mtime > st_right.st_mtime or st_left.st_size != st_right.st_size:
                shutil.copy2(os.path.join(comp.left, f), os.path.join(comp.right, f))
