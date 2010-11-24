**NOTE: both the software and the manual are under development. Expect things to change.**

Introduction
============

A bioinformatics project is often consists of many separate,
interdependent, steps. Once a project gets bigger it becomes vital to
apply some organization and automation.

There are many different ways to automate a bioinformatics project
. Many bioinformaticians, however, continue using the command-line or
tailor-made scripts to organize and automate their work. This has
obvious advantages, most importantly flexibility. Potential downsides
to scripting are that a project easily becomes disorganized and
untrackable unless explicit measures are taken.

Moa aims to assist in organizing, automating and maintaining a command
line bioinformatics project without losing flexibility. The best way
to understand how Moa aims to achieve this is by an example:

::

    moa new blast -t "run a demo"
    moa set blast_db=/data/blast/db/nt
    moa set blast_input_dir=../sequences/
    moa set moa_postprocess='grep polymerase gff/*gff > pol.gff'
    moa run

In the first line, a new BLAST job (titled "run a demo") is created in
the current directory. What really happens is that Moa creates a
script (Makefile) that imports a BLAST specific template. The next two
lines set a few parameters for BLAST. In the last line Moa is executed
and 'blasts' the input sequences (in ``../sequences``) against the
database in ``/data/blast/db/nt``. BLAST output files (XML) are
generated and converted to GFF (GFF conversion is an extra, not part
of the BLAST suite). The one to last statement is probably most
remarkable; it is a single (shell) commmand that will be executed
after BLAST is executed (there is a corresponding
``moa_preprocess``). This shell comamand filters all BLAST hits that
have the word "polymerase" in their description into a separater GFF
file.

Moa employs `GNU make <http://www.gnu.org/software/make>`_ to describe
its building blocks. GNU Make is originally developed for software
compilation. Compilation usually involves the execution of many
interdependent compilation and linker steps. GNU make is able to
compile large software projects with tens of thousands of source files
based on a Makefile that describes how a target file is to be
created. GNU Make is flexible enough to be used with practically any
programming language. Moreover, GNU Make can be used to automate any
series of commands as long as they can be executed from the command
line. It is therefore not only possible, but an excellent idea (not
mine), to use Gnu Make in bioinformatics projects (see `biowiki
<http://biowiki.org/MakefileManifesto>`_, `nodalpoint
<http://archive.nodalpoint.org/2007/03/18/a_pipeline_is_a_makefile>`_
or `biomake <http://skam.sourceforge.net/>`_)

Moa aims to do the following things:

-  *Organize a project*: Each Moa job must be located in its own
   directory. It is possible to automatically execute a directory tree
   of Moa jobs. Proper use of these features will result in a logical
   project structure.
- *Create reusable building blocks*: Moa templates are GNU Makefiles
   that follow a set of conventions. It is easy to implement new
   building blocks. (see chapter X).
-  *Document*: It is possible to add meta-data such as a title and
   description to each Moa job, making it easy to
-  *Provide a uniform interface*: Moa allows you to operate your
   project almost exclusively using a single command (conveniently
   called ``moa``).


Example session
---------------

The best way to understand how to use Moa is a sample session.

We'll start by creating directories to hold the data and analysis
structure:

::

    mkdir introduction
    cd introduction

We've created a directory ``introduction`` for the tutorial. Within
this directory we'll organize the components of our analysis. We
want to initialize this directory so that it becomes a part of this
Moa pipeline. This is useful later, if we want to run all analysis
at once. To do this, run:

::

    moa new project -t 'Introduction'

The ``moa new`` command is used to create new moa jobs. In this
case we create a job with the template "project". In itself this
template does not do anything but serves to group new projects. The
``-t`` parameters assigns a title to this Moa job. We will now
create a new directory to hold the first step of the pipeline:

::

    mkdir 10.download    
    cd 10.download
    moa new

Moa does not dictate a directory structure for your analysis
pipeline, but to make full usage of Moa it is advisable to create a
logical organization. Two important features of Moa that relate to
this are:


-  Each moa job is contained in one directory. Output files of a
   job are typically stored in that directory. It is not possible to
   have more than one Moa jobs in a directory.
-  Moa is able to automatically execute all jobs in a directory and
   the underlying sub-directories (using ``moa all``).

If properly used, these two features force a logical, modular,
project structure. To assign an order to the steps inside a
directory it is possible to prepend a number to the directory name
(i.e. "10."). Note that Moa sorts directories alphabetically and
not numerically

We will now created a new folder to hold a genome sequence we are
about to download and set up the Moa job to actually do the
download.

::

    mkdir 10.genome
    cd 10.genome
    moa new -t 'download a potato BAC' ncbi

Here we create a Moa job to download a sequence from
`NCBI <http://www.ncbi.nlm.nih.gov>`_ by using the "ncbi" template.
Once a Moa job is instantiated you can run ``moa help`` to get some
information on how to use this template

|moa help| Note that if you want help on how to use the moa itself,
you should use ``moa --help``

Before you can get the data from NCBI, you will have to tell Moa
what you want to download. This is easy if you know the Genbank
accession numbers. In this case we'll download the nucleotide
sequence (from the database "nuccore") with the accession id
AC237669.1

::

    moa set ncbi_db=nuccore 
    moa set ncbi_query=AC237669.1

You can check if the parameters are set correctly by running
``moa show``. This should come back with the following text: title
download a potato BAC ncbi\_query AC237669.1 ncbi\_db nuccore
ncbi\_sequence\_name

If everything seems fine, you can run this job:

::

    moa

Or, you could also have used ``moa run``. It is possible that you
get an error message notifying that "wget" or "xml\_grep" cannot be
found. Most, properly written, Moa templates do prerequisite
checking if necessary. If either of these tools is missing, you
will need to install them first (possibly by running
``sudo apt get install wget`` or
``sudo apt-get install xml-twig-tools``, or ask your system
administrator)

If Moa runs, quite a lot of output is generated. If things go
wrong, there is probably a clue to why it did not work in this
output. If the Moa job is successful, the last line should be "Moa
finished - Succes!". If you do an ``ls`` you now see a ``fasta``
directory with one fasta file. This fasta file contains the
downloaded genome.

Now we can start doing things with the downloaded sequence. To see
what other templates are available, try ``moa list``.


.. |moa help| image:: images/screenshot_moa_help.png