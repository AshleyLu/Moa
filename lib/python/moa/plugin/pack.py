# 
# Copyright 2009 Mark Fiers, Plant & Food Research
# 
# This file is part of Moa - http://github.com/mfiers/Moa
# 
# Moa is free software: you can redistribute it and/or modify it under
# the terms of the GNU General Public License as published by the Free
# Software Foundation, either version 3 of the License, or (at your
# option) any later version.
# 
# Moa is distributed in the hope that it will be useful, but WITHOUT
# ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
# or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU General Public
# License for more details.
# 
# You should have received a copy of the GNU General Public License
# along with Moa.  If not, see <http://www.gnu.org/licenses/>.
# 

"""
Arch - saves pipelines, or parts of pipelines for reuse
"""

import os
import re
import sys
import tarfile
import optparse

import moa.conf
import moa.info
import moa.conf
import moa.logger
l = moa.logger.l

def defineCommands(data):
    data['commands']['pack'] = { 
        'desc' : 'pack a job or pipeline, or manage packs',
        'call' : pack
        }
    data['commands']['unpack'] = { 
        'desc' : 'unpack an earlier packed job/pipeline',
        'call' : unpack
        }

def defineOptions(data):
    parser = data['parser']
    parserN = optparse.OptionGroup(parser, "Pack")
    data['parser'].set_defaults(saveRecursive=False)
    parserN.add_option("--pr", dest="packRecursive",
                       help="Recursively pack all underlying jobs",
                       action='store_true' )
    parserN.add_option("--pn", dest="packName",
                       help="Name for the pack, defaults to a name "
                       "derived from the job title" )
    parserN.add_option("--pd", dest="packData",
                       help="Include all data files into the save",
                       action='store_true' )
    try:
        parser.add_option("-d", dest="packData",
                          help="Create/unpack the job/pipeline int this directory")
    except optparse.OptionConflictError:
        #probably already defined in plugin/newjob
        pass
        
    data['parser'].add_option_group(parserN)

def prepare(data):
    """
    Check if the packpath exists
    """
    packPath = os.path.join(os.path.expanduser('~'), '.moa', 'packs')
    if not os.path.exists(packPath):
        os.makedirs(packPath)
        
    
def _addPath(wd, pth,  tar):
    l.info("Checking %s" % pth)
    if not moa.info.isMoaDir(pth):
        l.info("not Moa: ignoring %s" % pth)
        return
    
    if not wd in pth:
        raise Exception("Odd path?? %s, its not part of %s" %(
            pth, wd))
    
    rpth = pth.replace(wd, '.')
    l.info("Adding directory %s" % rpth)
    jobInfo = moa.info.info(rpth)

    l.debug("files: %s" % str(jobInfo['moa_files'].split()))
    for f in jobInfo['moa_files'].split():
        addFile = os.path.join(rpth, f)
        if not os.path.exists(addFile):
            continue
        l.info("Adding file %s" % addFile)
        tar.add(addFile)

def _getPackName2(data):
    options = data['options']
    if options.packName:
        packName = options.packName
        if not packName[-8:] == '.tar.bz2':
            packName += '.tar.bz2'
        if os.sep in packName:
            return os.path.split(packName)[1], packName
    else:
        packName = re.sub(
            "\W", "", "".join(
                [x.capitalize()
                 for x
                 in moa.info.getTitle(data['cwd']).split()]
                )
            )
        if not packName[-8:] == '.tar.bz2':
            packName += '.tar.bz2'


    packPath = os.path.join(
        os.path.expanduser('~'), '.moa', 'packs',
        "%s" % packName)
    
    return packName, packPath
                    
def _getPackName(data):
    packName, packPath = _getPackName2(data)

    if (not data['options'].force) and os.path.exists(packPath):
        l.error(('Pack %s exists, use a different name (--pn) or ' % packName) +
                'specify -f to overwrite')
        sys.exit(-1)
    return packName, packPath
    
def pack(data):
    """
    Create an adhoc job
    """
    wd = data['cwd']
    if wd[-1] == '/': wd = wd[:-1]
    
    options = data['options']
    args = data['newargs']

    #see if we're calling a pack command
    if args:
        if args[0] == 'unpack': return unpack(data)
        elif args[0] == 'list' : return listPacks(data)
        elif args[0] == 'rm' : return rmPack(data)        
    

    packName, packPath = _getPackName(data)
    l.info('start creating pack in %s' % wd)
    l.info("pack name: %s" % packName)
    l.info("pack path: %s" % packPath)

    TF = tarfile.open(
        name = packPath,
        mode = 'w:bz2')

    if args:
        l.info("packing with args %s" % args)
        packArgsFile = os.path.join(wd, 'moa.packargs')        
        with open(packArgsFile, 'w') as F:
            F.write(" ".join(args))
        l.info("adding %s" % packArgsFile)
        
        TF.add(packArgsFile, os.path.basename(packArgsFile))
        os.unlink(packArgsFile)
        
    if options.packRecursive:
        for dirpath, dirnames, filenames in os.walk(wd):
            _addPath(wd, dirpath, TF)
    else:
        _addPath(wd, wd, TF)

    l.info("done packing")
    TF.close()


def _unpack2(data, packName):
    options = data['options']
    if options.directory:
        target = options.directory
        if not os.path.exists(target):
            os.makedirs(target)        
    else:
        target = '.'
    if (not options.force) and (moa.info.isMoaDir(target)):
        l.error("There is already a moa job in %s" % target)
        l.error("Use force (-f) to unpack it here")
        sys.exit(-1)

    #prepare for a relative path correction..
    wd = data['cwd']    
    relPathCorrection = os.path.relpath(wd, target)
        
    l.info("Unpackiving %s" % packName)
    options
    TF = tarfile.open(name = packName, mode = 'r:bz2')
    TF.extractall(path=target)
    TF.close()

    #see if we were called with extra arguments
    args = data['newargs'][1:]
    l.info("called with args: %s" % " ".join(args))
    
    #process pack arguments
    #see if we can find & open a packargs file
    packArgsFile = os.path.join(target, 'moa.packargs')
    if not os.path.exists(packArgsFile):
        #we're done!
        return True
    with open(packArgsFile) as F:
        packArgs = F.read().strip().split()
    os.unlink(packArgsFile)
    l.info("read packargs %s" % " ".join(packArgs))
    if args and not packArgs:
        l.error("You have supplied extra arguments, but there are none "
                "specified in the pack - not setting anything")
        return
    if len(args) > len(packArgs):
        l.error("You've supplied more arguments that the pack defines "
                "- Not setting anything")
        return
    
    for a in range(len(args)):
        l.info("setting %s to %s" % (packArgs[a], args[a]))
        moa.conf.setVar(target, packArgs[a], args[a],
                        relPathCorrection = relPathCorrection)
        
def unpack(data):
    args = data['newargs']
    packName = args[0]
    originalPackname = packName

    #discover where the archive is
    if os.path.exists(packName):
        return _unpack2(data, packName)
    if os.path.exists("%s.tar.bz2" % packName):
        return _unpack2(data, "%s.tar.bz2" % packName)
    if not packName[-8:] == '.tar.bz2':
        packName += '.tar.bz2'
    packLoc = os.path.join(
        os.path.expanduser('~'), '.moa', 'packs', packName)
    l.debug("chekcing %s"% packLoc)
    if os.path.exists(packLoc):
        return _unpack2(data, packLoc)

    l.error("Could not locate pack %s" % originalPackname)
    sys.exit(-1)

def listPacks(data):
    packDir = os.path.join(
        os.path.expanduser('~'), '.moa', 'packs')
    for f in os.listdir(packDir):
        if f[-8:] == '.tar.bz2':
            packFile = os.path.join(packDir, f)
            TF = tarfile.open(packFile, 'r:bz2')
            try:
                PAF = TF.extractfile('moa.packargs').read()
            except KeyError:
                PAF = ""
                pass #moa.packargs does not seem to exists
            TF.close
            print "%s\t%s" % (f[:-8], PAF)

def rmPack(data):
    packDir = os.path.join(
        os.path.expanduser('~'), '.moa', 'packs')
    for pack in data['newargs']:
        if pack == 'rm': continue
        packFile = os.path.join(packDir, '%s.tar.bz2' % pack)
        if not os.path.exists(packFile):
            l.error("cannot find a pack file for %s" % pack)
            l.error("Checked: %s" % packFile)
            sys.exit(-1)
        os.unlink(packFile)