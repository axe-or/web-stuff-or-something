# Making interfaces in C

The C programming language is an old stinky language, however, it is *very* powerful, while C's type system does not
have the notion of an interface, they can be hand made with one fat pointer.

This article will explore a *virtual table* approach first, and a style of simplification (which sometimes makes it
faster) will be offered by the end of it.

## A `memory_allocator` interface

Let's start by making an interface we might actually use, C is a manual memory managed language, and its default
allocation interface is quite lacking. Having basically 3 functions: `malloc()`, `free()` and `realloc()` and only
supporting one global allocator. So let's create a flexible interface for different kind of memory allocators, including
libC's default one.

```c
struct memory_allocator {
	void* data;
	struct memory_allocator_vtable* vtable;
};

struct memory_allocator_vtable {
	void* (*alloc) (size_t size, uint alignment);
	void (*free_all) (void);
	void (*free) (void* pointer, uint alignment);
	void* (*realloca) (void* pointer, size_t new_size, uint alignment, size_t oldsize);
};
```