"""
**logger** - Log Moa activity



"""

import os
import re
import sys
from datetime import datetime

import moa.job
import moa.logger as l
import moa.plugin

def defineCommands(data):
    data['commands']['log'] = { 
        'desc' : 'Show the logs for this job',
        'call' : showLog,
        'log' : False
        }

def prepare(data):
    data.logger.start_time = datetime.today()

def niceRunTime(d):
    if ',' in d:
        days, time = d.split(',')
    else:
        days = 0
        time = d
    hours, minutes, seconds = time.split(':')
    hours, minutes = int(hours), int(minutes)
    seconds, miliseconds = seconds.split('.')
    seconds = int(seconds)
    miliseconds = int(miliseconds)
    
    if days > 0:
        if days == 1:
            if hours == 0:
                return "one day"
            else:
                return "one day, %d hours" % hours
        else:
            return "%d days" % days
    if hours == 0 and minutes == 0 and seconds == 0:
        return "<1 sec"
    if hours > 0:
        return "%d hrs" % hours
    elif minutes > 0:
        return "%d min" % int(float(seconds) / 60)
    else:
        return "%d sec" % seconds
    
def finish(data):
    data.logger.end_time = datetime.today()
    data.logger.run_time = data.logger.end_time - data.logger.start_time
    runtime = data.logger.end_time - data.logger.start_time
    logFile = os.path.join(data.job.confDir, 'log')

    if data.originalCommand in data.commands.keys():
        commandInfo = data.commands[data.originalCommand]
        if commandInfo.get('log', False):
            #do not log this command!
            return

    with open(logFile, 'a') as F:
        F.write("%s\n" % "\t".join([
            str(data.rc),
            ",".join(data.executeCommand),
            data.logger.start_time.strftime("%Y-%m-%dT%H:%M:%S:%f"),
            data.logger.end_time.strftime("%Y-%m-%dT%H:%M:%S:%f"),
            str(runtime),
            " ".join(sys.argv)
            ]))
        
def showLog(data):
    args = data.args
    if len(args) > 1:
        noLines = int(args[1])
    else:
        noLines = 5
        
    logFile = os.path.join(data.job.confDir, 'log')    
    with open(logFile) as F:
        #read the last 2k - prevent reading the whole file
        try:
            F.seek(-1 * noLines * 250, 2)
        except IOError:
            F.seek(0)
        F.readline()
        lines = F.readlines()[-1 * noLines:]
        for line in lines:
            rc, command, start, stop, delta, command = \
                line.split("\t")
            lc = "%s - " % start.rsplit(':',1)[0]
            if int(rc) == 0:
                lc += "{{bold}}{{green}}Success {{reset}}"
            else:
                lc += "{{bold}}{{red}}%-8s{{reset}}" % ("Err " + str(rc))

            lc += " - %8s" % niceRunTime(delta)
            lc += " - " + command
            moa.ui.fprint(lc, f='jinja')
