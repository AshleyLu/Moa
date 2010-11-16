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
Template
"""

import os
import yaml
import UserDict

import Yaco

import moa.utils
import moa.logger as l

MOABASE = moa.utils.getMoaBase()
TEMPLATEDIR = os.path.join(MOABASE, 'template2')

class InvalidTemplate(Exception):
    """ Invalid Template """
    pass
    
class Template(Yaco.Yaco):
    
    #template_keys = ['description', 'commands', 'help', 'moa_id', 
    #                 'parameter_category_order', 'author', 'creation_date',
    #                 'modification_date', 'name', 'type']
    
    def __init__(self, templateName = None):
        """
        Initialze the template object, which means:
        
        * Check if the template exists, if not raise an Exception
        * Load template info
        """        

        self.name = 'nojob'
        self.backend = 'nojob'
        self.parameters = {}        
        
        if templateName:
            self._templateDataFile = os.path.join(
                TEMPLATEDIR, '%s.moa' % templateName)
            if not os.path.exists(self._templateDataFile.value):
                raise InvalidTemplate()
            l.debug("loading template from %s" % self._templateDataFile.value)
            self.load(self._templateDataFile.value)
            
        l.debug("set template to %s, backend %s" % (self.name, self.backend))
        
def check(what):
    """
    Check if a template exists

        >>> check('adhoc')
        True
        >>> check('nonexistingtemplate')
        False
    """
    try:
        template = Template(what)
        return True
    except:
        return False


def listAll():
    """
    List all known templates, returns a tuple of:
    (templatename, templatefile)

        >>> result = list()
        >>> len(result) > 0
        True
        >>> type(result) == type([])
        True
        >>> 'adhoc' in result
        True

    @returns: a list with all known templates
    @rtype: a list of strings
    
    """
    r = []
    for path, dirs, files in os.walk(TEMPLATEDIR):
        relPath = path.replace(TEMPLATEDIR, '')
        if relPath and relPath[0] == '/':
            relPath = relPath[1:]
        if relPath and relPath[-1] != '/':
            relPath += '/'
        files.sort()
        for f in files:
            if f[0] == '.': continue
            if f[0] == '_': continue
            if f[0] == '#': continue
            if f[-1] == '~': continue
            if not '.moa' in f: continue
            name = f.replace(".moa", "")
            yield(os.path.join(path, f), name)

def listAllLong():
    """
    Returns a generator yielding tuples of all templates and a
    corresponding description.

        >>> ll = listLong()
        >>> fi = ll.next()
        >>> type(fi) == type((1,2))
        True
        >>> type(fi[0]) == type('hi')
        True
        >>> type(fi[1]) == type('hi')
        True

    @returns: a generator yielding (name, description) tupels
    @rtype: generator
    """
    for tFile, tName in listAll():
        t = Template(tName)
        yield tName, t.description.value
