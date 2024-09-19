# Why I don't like language package managers

I don't like language package managers, or most package managers although I do think programming language ones are
the most nefarious.

## Definitions

A *package manager* is a tool that automates the retrieval and installation of *packages* and their *dependencies*. The
package manager also checks of version conflicts and other installation conditions which could cause an improper state
in the environment.

A *package* is somewhat ill-defined, this will be one of the main points of the article but for now let's simply assume
a package is bundle of library code and/or a set of executable tools.

A *dependency* is something the package requires for its proper functioning. Note that the dependency problem goes
deeper as some dependencies are conditional (depend on a build settings of the software) while other may just be *build
dependencies* which are needed to *build* the artifacts but not run them.

## The purpose of automation

Automation is taking a process and making it standardized and human-indepedent, the role of automation is crucial in
human life as it frees time and energy for other more desirable activities, computers themselves are an automation over
many sequential processes of mathematics and data processing.

Not everything however, needs to be automated, there are particular aspects of life where automation is unsuited, the 2
main cases are when the activity does not suffer from the same disutility that labor has (e.g: Spending time with your loved
ones or watching a movie you like) *or* when the automation of the process causes a generally negative tradeoff
over the non-automated version. I affirm that language package managers fall into the second category, by both being
technically very laborious in certain cases and reinforcing behavior patterns which lead to less reliable and
maintainable software.

## Dependencies and liability

When you add a dependency, regardless of language, you're transfering the responsability to another third party, which
may or may not have competent code. This is understandable in many cases, we don't need to reinvent font rendering every
project, and trying to roll out your own encryption unless you **deeply** know the subject is usually a recipe for
disaster.

However, you are not free from responsability, ever, when I use STB libraries for rendering fonts as an example, I'm
trusting and making myself and my software partially liable for the mistakes that its author Sean Barret may make. I
trust Sean, and I find the code in his libraries to be of good quality, so I accept this tradeoff, the same cannot be
said for recursively adding 500 node modules. No human has enough time and mental fortitude to even tell at a glance the
general quality of all libraries included by usual JS project.

Another security concern is that package repositories are a great target for supply-chain attacks. Again, the quality of
the code you depend on becomes exponentially harder to protect and verify its quality the more potential sources it
depends on.

For people who create either open-source or proprietary software, another problem with automating dependency management
is how easy it becomes to accidentally add (even if indirectly) software with incompatible licenses. For a commercial
product, all it takes is a small non-licensed software or a AGPLv3 module to cause a massive legal trouble. The same
goes for open source contributors, which may wish to have a permissive license, and accidentally add faux-OSS libraries
(such as the disgusting SSPL license) or libraries with a copyleft license which makes their contribution now
incompatible with all commercial or other permissive open projects.


## The behavioral impact of package managers

You don't need a degree in psychology to observe that people generally prefer to take the easier route, that's obvious,
I don't want make to my work harder unless there's a really good reason to, and tracking dependencies is a very
laborious and boring task, anyone who ever dealt with cascades of linker errors in C or C++ will know how frustrating
the game of symbol Whack-A-Mole becomes.

Package managers partially solve that, at the expense of making adding dependencies *too easy*, while the convenience is
undedeniable, the purpose it serves is nefarious, it's a convenient way to create dependency hell. When excessive
complexity becomes the easy route, it's natural the majority of engineers will gravitate towards it, it's better to
crush the snake's head, and instead of automating the problem, start using less dependencies that are higher quality.

## Package managers hide the true problem

The issue is, package managers are not solving the *true* problem, the problem isn't "tracking dependencies is boring",
but *why* do we:

1. Need so many dependencies in the first place?

2. Why are dependencies not self contained? Why do your dependencies (which should be *dependable* and trustworthy)
   also depend on *so much crap*?

The first reason can be explained mainly by poor standard libraries that languages offer and complexities of modern
software. This can be mitigated by having better libraries and reducing complexity whenever possible, I won't pretend
like you're always able to make things simple, some problems are inherently complex, however, you should *never* make
them *more complex*, and most programmers drastically underestimate how much complexity they accidentally add when
trying to find "just the right abstraction" for the job.

The second reason is the most important one, depenencies which are not dependable, when you simply want to run a a URL
router and you get an entire testing framework, ORM, and `is-odd` because the library author could not contain
themselves. A good dependency must do its job, do it well, nothing more and nothing less. This is distinct from the
notion of "code bloat", adding too many dependencies generally causes a software to become bloated, but it's not a
necessity, espcially in the JavaScript, Python and Rust ecossystems, some dependencies are so extremely tiny they are
not even worthy of being called code bloat.

## SemVer is not enough

SemVer (AKA *Semantic Versioning) is a specification on how version numbers should relate to incompatibilities in an
API. I do not think SemVer is by itself a bad idea, however, it is overly idealistic, not only verifying complaince with
SemVer automatically is very difficult, but it does not address the fact that people rely on bugs, and they rely a *lot
more* on bugs than you might think.

To build actually reliable software, avoid at all costs depending on version ranges of a library, instead *choose a
particular version and pin it*. Only update when needed, and do it carefully, it is a minor inconvenience to pay for not
having to worry about `libfoo-v2.3.1` accidentally fixing a bug you relied (accidentally or not) on version `v2.3.2`.

If possible, vendor your dependencies, or add that as an option, developers shoul dbe able to work on your project with
little setup, and users should require **no** setup.

## What to do instead?

The effort to reduce dependency hell is a noble one, but how to go about it? Here are things which language authors and
compiler designers can do:

- Make the definition of a package **extremely well defined**. And preferrably, make adding dependencies a
  straightforward but manual process. Ideally, each dependency should just be a folder or zip archive the programmer
  can use.
  
- Do not provide a language package manager.

- Do not ship "build systems", design the language compiler/interpreter in a way their necessity is maximally reduced
  by having the concept of package/module be a part of the language, not an afterthought.
  
- Do not rely on SemVer ranges for package versioning, I'm not saying to *not* use SemVer, but always refer **one**
  specific version.

Now, things which programmers can do:
 
- Rely on a small number of dependencies, think *very well* before adding anything, you might not need it or you might
  be able to implement the functionality you need anyways without wasting too much time.
 
- Only choose high-quality dependencies, they don't need to be *famous*, but look for self-contained, well tested
  libraries. Avoid libraries that have more marketing than code.

- Statically build your binaries, do not try to please "package maintainers". Make your program as self contained as
  possible, users should generally be able to download a single zip file and have things just work.
  
- Build your libraries as static archives, avoid dynamic linking as much as you can.
