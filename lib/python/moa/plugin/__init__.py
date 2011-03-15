#moa python plugins
"""
Handle Moa commands (i.e. anything that you can run as `moa COMMAND` on the
commandline
"""

import os
import sys
import UserDict
import moa.logger as l

import Yaco

## Load & handle plugins
class PluginHandler(UserDict.DictMixin):

    def __init__(self, plugins):

        ## Determine what plugins are loaded
        self.plugins = {}
        self.data = Yaco.Yaco({'plugins' : self})
        self.allPlugins = plugins
        l.debug("Plugins %s" % ", ".join(self.allPlugins))
        ## load the plugins as seperate modules. A plugin does not need to
        self.initialize()

    def initialize(self):
        """
        attempt to load the python part of the plugins
        """
        ## do we have a python module??
        l.debug('Start plugin init')
        for plugin in self.allPlugins:
            pyModule = 'moa.plugin.%s' % plugin
            try:
                _m =  __import__( pyModule, globals(), locals(), ['git'], -1)
                self.plugins[plugin] = _m
                l.debug("Successfully Loaded module %s" % pyModule)
            except ImportError, e:
                if not str(e) == "No module named %s" % plugin:
                    raise
                #l.debug("No python plugin module found for %s" % plugin)

        newOrder = []
        for plugin in self.keys():
            newOrder.append((getattr(self[plugin], 'order', 100), plugin))
        newOrder.sort()
        self.allPlugins = [x[1] for x in newOrder]
            

    def register(self, **kwargs):
        """
        Keep track of a dictionary of data that might be used
        by any of the plugins - this seems cleaner than relying
        on using globals
        """
        for k in kwargs:
            self.data[k] = kwargs[k]
            
    def run(self, command):
        rv = {}
        for p in self.allPlugins:
            if not command in dir(self[p]):
                continue
            l.debug("plugin executing hook %s for %s" % (command, p))
            rv['p'] = getattr(self[p], command)(self.data)
        return rv
            
    def runCallback(self, command):
        """
        Run a plugin callback 
        """
        command['call'](self.data)

    def getAttr(self, attribute):
        """
        A generator that returns all plugins and the
        requested attribute
        """
        for p in self.allPlugins:
            a = getattr(self[p], attribute, None)
            if a: yield p, a
        
    # Implement the basic functions for a dict
    #
    def __getitem__(self, item):
        return self.plugins[item]

    def __setitem__(self, item, value):
        self.plugins[item] = value

    def keys(self):
        return self.plugins.keys()

#Should I create a global placeholder for this moa run??
#moaPlugins = Plugins()

class BasePlugin:
    def __init__(self):
        self.data = {}

    def register(self, **kwargs):
        """
        Register a set of variables for use by the plugin
        """
        self.data.update(kwargs)
