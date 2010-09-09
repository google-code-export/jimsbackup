import os, unittest, tempfile, shutil
import hardlink, samefile

class HardlinkBadInput(unittest.TestCase):
    def setUp(self):
        self.d1 = tempfile.mkdtemp()
        self.d2 = tempfile.mkdtemp()
        f = tempfile.mkstemp()
        os.close(f[0])
        self.f1 = f[1]
        f = tempfile.mkstemp()
        os.close(f[0])
        self.f2 = f[1]
        os.remove(self.f2)
    def tearDown(self):
        os.rmdir(self.d1)
        os.rmdir(self.d2)
        os.remove(self.f1)
        try:
            os.remove(self.f2)
        except:
            pass
    def testDifferentTypesDirFile(self):
        self.assertRaises(hardlink.DifferentTypesError, hardlink.hardlink, self.d1, self.f1)
    def testDifferentTypesFileDir(self):
        self.assertRaises(hardlink.DifferentTypesError, hardlink.hardlink, self.f1, self.d1)

class HardlinkSourceDoesntExist(unittest.TestCase):
    def setUp(self):
        self.d1 = tempfile.mkdtemp()
        os.rmdir(self.d1)
        self.d2 = tempfile.mkdtemp()
        f = tempfile.mkstemp()
        os.close(f[0])
        self.f1 = f[1]
        os.remove(self.f1)
        f = tempfile.mkstemp()
        os.close(f[0])
        self.f2 = f[1]
    def tearDown(self):
        os.rmdir(self.d2)
        os.remove(self.f2)
    def testDirectorySource(self):
        self.assertRaises(hardlink.SourceDoesntExistError,
                          hardlink.hardlink, self.d1, self.d2)
    def testFileSource(self):
        self.assertRaises(hardlink.SourceDoesntExistError,
                          hardlink.hardlink, self.f1, self.f2)

class HardlinkDestExists(unittest.TestCase):
    def setUp(self):
        self.d1 = tempfile.mkdtemp()
        self.d2 = tempfile.mkdtemp()
        f = tempfile.mkstemp()
        os.close(f[0])
        self.f1 = f[1]
        f = tempfile.mkstemp()
        os.close(f[0])
        self.f2 = f[1]
    def tearDown(self):
        os.rmdir(self.d1)
        os.rmdir(self.d2)
        os.remove(self.f1)
        os.remove(self.f2)
    def testFileSource(self):
        self.assertRaises(hardlink.DestExistsError, hardlink.hardlink, self.f1, self.f2)
        

class HardlinkTwoFiles(unittest.TestCase):
    def setUp(self):
        f = tempfile.mkstemp()
        os.close(f[0])
        self.f1 = f[1]
        f = tempfile.mkstemp()
        os.close(f[0])
        self.f2 = f[1]
        os.remove(self.f2)
    def tearDown(self):
        os.remove(self.f1)
        os.remove(self.f2)
    def runTest(self):
        hardlink.hardlink(self.f1, self.f2)
        self.assertTrue(samefile.files_are_equal(self.f1, self.f2))

class HardlinkTwoDirs(unittest.TestCase):
    def setUp(self):
        self.d1 = tempfile.mkdtemp() # source dir
        d1_1 = tempfile.mkdtemp(dir=self.d1) # subdir under source
        f = tempfile.mkstemp(dir=self.d1) # file under source
        os.close(f[0])
        f = tempfile.mkstemp(dir=d1_1) # file under source subdir
        os.close(f[0])
        self.d2 = tempfile.mkdtemp() # dest dir        
    def tearDown(self):
        shutil.rmtree(self.d1)
        shutil.rmtree(self.d2)
    def runTest(self):
        hardlink.hardlink(self.d1, self.d2)
        for root, dirs, files in os.walk(self.d1):
            newroot = os.path.join(self.d2, os.path.relpath(root, self.d1))
            for f in files:
                self.assertTrue(samefile.files_are_equal(os.path.join(newroot, f),
                                                         os.path.join(root, f)))
                                
if __name__ == "__main__":
    unittest.main()

