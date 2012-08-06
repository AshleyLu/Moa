
"""
Functions to support pelican
"""

import os
import jinja2
jenv = jinja2.Environment(loader=jinja2.PackageLoader('moa.plugin.system.doc'))

import moa.logger
l = moa.logger.getLogger(__name__)

from Yaco import Yaco

def _getpagename(name):
    l.critical("creating page for %s" % name)
    pagedir = os.path.join('doc', 'pages')
    if not os.path.exists(pagedir):
        os.makedirs(pagedir)
    
    return os.path.join(pagedir, name)


def generate_readme_page(job):
    """
    Create a parameter page for pelican
    """
    if not os.path.exists('README.md'):
        return

    targetdir = os.path.join('doc', 'pages')
    if not os.path.exists(targetdir):
        os.makedirs(targetdir)
    targetfile = os.path.join(targetdir, 'readme.md')

    with open(targetfile, 'w') as F:
        F.write("Title: readme\n\n")
        with open('README.md') as G:
            F.write(G.read())

def generate_parameter_page(job):
    """
    Create a parameter page for pelican
    """

    jtemplate = jenv.select_template(['parameter.page.jinja2'])
    pagename = _getpagename('parameters.md')

    #max paramater key length
    mkl = max([len(x) for x in job.conf.keys()])+4
    mvl = max([len(str(x)) for x in dict(job.conf).values()])
    fsk = '%-' + str(mkl) + 's'
    fsv = '%-' + str(mvl) + 's'
    head1 = ('%-' + str(mkl) + 's | FLAG  | %-' + str(mvl) + 's') % ('key', 'value')
    head2 = ('%-' + str(mkl) + 's | ----- | %-' + str(mvl) + 's') % ('-' * mkl, '-' * mvl)
    print head1
    
    with open(pagename, 'w') as F:
        F.write(jtemplate.render({
                    'keys' : sorted(job.conf.keys()),
                    'conf' : job.conf,
                    'rendered' : job.conf.render(),
                    'job' : job,
                    'fsk' : fsk,
                    'fsv' : fsv,
                    'head1' : head1,
                    'head2' : head2,
                    
                    }))


def generate_file_page(job):
    """
    Prepare a list of files for display 
    """
    ## perform some file magic

    jtemplate = jenv.select_template(['file.page.jinja2'])
    pagename = _getpagename('files.md')

    
    filesets = job.template.filesets.keys()
    filesets.sort()
    
    fsets = []
    fmaps = []

    data = Yaco()

    for fsid in filesets:
        templateInfo = job.template.filesets[fsid]
        files = job.data.filesets[fsid].files
        
        if templateInfo.type == 'set':
            fsets.append(fsid)
            continue
        elif templateInfo.type == 'map':
            fmaps.append(fsid)
            continue
        else:
            data.single['fsid'].files = files
        #     if len(files) == 0:
        #     moa.ui.fprint(
        #         ('* Fileset: %%(bold)s%-20s%%(reset)s (single): ' +
        #          '%%(bold)s%%(red)sNo file found%%(reset)s') % fsid )
        # elif len(files) == 1:
        #     moa.ui.fprint(
        #         '* Fileset: {{bold}}%-20s{{reset}} (single)\n' % fsid,
        #         f='jinja')
        #     moa.ui.fprint('   ' + _preformatFile(files[0]), f='jinja')
            
    if len(fsets + fmaps) == 0:
        with open(pagename, 'w') as F:
            F.write(jtemplate.render(data))
        return
    
    #rearrange the files into logical sets
    nofiles = len(job.data.filesets[(fsets + fmaps)[0]].files) 
   
    data.sets = []
    for i in range(nofiles):
        thisSet = []
        for j, fsid in enumerate((fsets + fmaps)):
            files = job.data.filesets[fsid].files
            templateInfo = job.template.filesets[fsid]
            thisSet.append((templateInfo.category,
                            templateInfo.type,
                            fsid,
                            files[i],
                            os.path.dirname(files[i]),
                            os.path.basename(files[i])))
        data.sets.append(thisSet)

    with open(pagename, 'w') as F:
        F.write(jtemplate.render(data))

    return


            #         if j == 0:
    #             moa.ui.fprint("  {{bold}}%3d{{reset}}:" % i, f='jinja', newline=False)
    #         else:
    #             moa.ui.fprint("      ", f='jinja', newline=False)
    #         cat = templateInfo.category
    #         if cat == 'input':
    #             moa.ui.fprint("{{green}}inp{{reset}}", f='jinja', newline=False)
    #         elif cat == 'output':
    #             moa.ui.fprint("{{blue}}out{{reset}}", f='jinja', newline=False)
    #         else:
    #             moa.ui.fprint("{{red}}%s{{reset}}" % cat[:3], f='jinja', newline=False)
    #         moa.ui.fprint(" {{gray}}%-5s{{reset}}" % templateInfo.type, f='jinja', newline=False)
    #         moa.ui.fprint(" {{bold}}%-20s{{reset}} " % fsid, f='jinja', newline=False)
    #         moa.ui.fprint(_preformatFile(files[i]), f='jinja', newline=False)
    #         moa.ui.fprint("")
    #     moa.ui.fprint("")


    # dar = sysConf.www.dataRoot
    # wer = sysConf.www.webRoot
    # rv = []
    # for f in fileList:
    #     #if f[0] == '.':
    #     #    f = os.path.join(sysConf.job.wd, f)
            
    #     fup = os.path.abspath(f)
    #     if os.path.exists(fup):
    #         linkClass = 'moaFileExists'
    #     else:
    #         linkClass = 'moaFileAbsent'
            
    #     if fup.find(dar) == 0:
    #         fullurl = fup.replace(dar, wer)
    #         dirurl = os.path.dirname(fup).replace(dar,wer)
    #         link = '<a class="%s" href="%s#fileBrowser">%s</a>' % (
    #             linkClass, dirurl, os.path.basename(fup))  
    #         if linkClass == 'moaFileExists':
    #             link += ' <span style="font-size: 60%%;">(<a href="%s">dl</a>)</span>' % (fullurl)
    #         rv.append(link)
    #     else:
    #         rv.append("%s" % (f)) #os.path.basename(f)))
    # return rv
