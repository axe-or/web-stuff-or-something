# Making interfaces in C

The C programming language is an old stinky language, however, it is *very* powerful, while C's type system does not
have the notion of an interface, they can be hand made with one fat pointer.

This article will explore a *virtual table* approach first, and a style of simplification (which sometimes makes it
faster) will be offered by the end of it.

## What is an interface?

"Interface" is an abstract concept, but the fundamental notion is that of a *contract*, here the word "interface" will
mean a pointer to a data type that fulfils a particular specification regarding its functionality. This
approach allows for runtime polymorphism and dynamic dispatch *without* inheritance or sub-typing.

The data layout of an interface goes like this:
```c
struct my_interface_vtable {
	// Interface functionality ("methods")
	void (*foo) (void*, int);
	void (*bar) (void*, char const*, int, int);
};

struct my_interface {
	void* impl_data;
	struct my_interface_vtable* vtable;
};
```

Note that all interface methods must take a `void*` first, this is required so that an object that implements that interface can transfer its state into to the functionality.

A "raw" call to the interface method will look like this:
```c
int result = object.vtable->the_function(object.impl_data, /* rest of arguments */);
```

Naturally, this boilerplace becomes annoying, so we write helpers for it:
```c
int the_function(struct my_interface object, /* rest of arguments */){
	return object.vtable->the_function(object.impl_data, /* rest of arguments */);
}

int result = the_function(object);
```

## A Memory Allocator interface

Let's start by making an interface we might actually use, C is a manual memory managed language, and its default
allocation interface is quite lacking. Having basically 3 functions: `malloc()`, `free()` and `realloc()` and only
supporting one global allocator. So let's create a flexible interface for different kind of memory allocators, including
libC's default one.

```c
struct memory_allocator_vtable {
	void* (*alloc) (void* impl, size_t size);
	void (*free_all) (void* impl);
	void (*free) (void* impl, void* ptr, size_t size);
	void* (*realloc) (void* impl, void* ptr, size_t new_size, size_t old_size);
};

struct memory_allocator {
	void* data;
	struct memory_allocator_vtable* vtable;
};

```

## Making an allocator that conforms to the interface

As a test, let's create a counter allocator, it will simply wrap C's existing allocation facitilies, but also it will
store the total memory allocated and the biggest allocation. This allocator won't be particularly useful, it's only to
demonstrate how one can use this system to wrap other more useful structures, like pool allocators, ring buffers,
arena allocators, etc.

```c
struct count_allocator {
	size_t total;
	size_t peak;
};

void* count_alloc(struct count_allocator* ca, size_t nbytes){
	void* ptr = malloc(nbytes);
	if(ptr){
		ca->total += nbytes;
		ca->peak = max(ca->peak, nbytes);
	}
	return ptr;
}

void count_free(struct count_allocator* ca, void* ptr){
	free(ptr);
}

void* count_realloc(struct count_allocator* ca, void* ptr, size_t new_size){
    void* rptr = realloc(ptr, new_size);
    if(rptr){
        ca->total += new_size;
        ca->peak = max(ca->peak, new_size);
    }
    return rptr;
}
```

You may notice that our counter allocator functions do not directly conform to the interface, and that is perfectly
fine. We don't need to conform directly, we only need to *wrap* it in a conforming signature.

```c
static void* _count_alloc(void* impl, size_t size){
	return count_alloc((struct count_allocator*)impl, size);
}

static void _count_free_all(void* impl){
	(void)impl;
	// Nothing... You can add a debug-mode panic here.
}

static void _count_free(void* impl, void* ptr, size_t size){
	(void)size; // Ignore this argument, as the allocator doesnt need it
	count_free((struct count_allocator*)impl, ptr);
}

static void* _count_realloc(void* impl, void* ptr, size_t new_size, size_t old_size){
	(void)old_size;
    return count_realloc((struct count_allocator*)impl, ptr, new_size);
}

```

Now that the glue is done, we simply must create a vtable to hold the wrappers.

```c
static const struct memory_allocator_vtable count_vtable = {
	.alloc = _count_alloc,
	.free = _count_free,
	.free_all = _count_free_all,
	.realloc = _count_realloc,
};
```