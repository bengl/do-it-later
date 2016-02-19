# do-it-later

A simple and easy renaming of poorly named functions like `nextTick` and
`setImmediate`, to make it easier for folks who are newer to Node.js.

## API

### `thisTick(fn)`

This will schedule the function `fn` to be executed after all the code in the
current iteration has completed (that is, when the stack is cleared), but before
the end of the current iteration.

<!-- TODO dive deeper here -->

> **Advanced:** Yes, this is exactly `process.nextTick` and you can treat it as
such. It's renamed in this library since the original name isn't very clear.

### `laterTick(fn)`

This will schedule the function `fn` to be executed in a future iteration of the
event loop. It's not guaranteed that it will be in the very *next* iteration of
the event loop, just that it won't be in the current one, and will be in some
future one.

<!-- TODO dive deeper here -->

> **Advanced:** Yes, this is almost exactly `setImmediate`. For consistency with
`thisTick`, it does not return an object with which to cancel the execution of
the future code. While this is a departure from the built-in functionality, the
consistency between these two functions is valued.

## Background

Node.js executes code in a loop (usually called the "event loop") that runs for
the entire time the process is running. There are several ways that code gets
inserted into the event loop.

* *Callbacks:* Every function in Node.js core (and most functions in userland
libraries) that takes in a callback results in that callback being called in
a future iteration of the loop.
* *Main code:* The initial code for your program is run in the first iteration of
the loop.
* *Event loop helpers:* Some Node.js builtin functions, and the functions in this 
library and others, can insert code to run in the current loop iteration or a
future one.

The end of a loop iteration happens when the call stack is empty. That means
when there is no longer any code to execute. The functions called during this
iteration have completed executing, and so have all the functions they've
called. This doesn't include callbacks passed to Node.js core I/O functions,
since (as already discussed), they're only executed in future iterations.

For example, consider thie following code:

```js
var fs = require('fs')
function fileHasBeenRead(e) {
    if (!e) {
        console.log('Yay we read the file!')
    }
}
fs.readFile('foo.txt', fileHasBeenRead)
```

In this program, there are two iterations of the loop in which code is running.
The first iteration only runs the code that gets the `fs` library, and then
issues the `readFile`, instructing node to run `fileHasBeenRead` once the read
operation has been completed. That happens in a later iteration of the event
loop. So, since that's only going to happen in a future iteration, this
iteration is done.

Once `readFile` has completed, it schedules `fileHasBeenRead` to be executed in
a later iteration, and since there's no other code in this program, the only
code that will be run in this second iteration is the `fileHasBeenRead`
function.

Now consider this code:

```js
var fs = require('fs')
function fileHasBeenRead(e) {
    if (!e) {
        console.log('Yay we read the file!')
    }
}
fs.readFile('foo.txt', fileHasBeenRead)
var x = 0
while (x != 0.061234301421791315) {
    x = Math.random()
}
```

Now there's a bunch of code *after* the call to `readFile`. Since `readFile` is
asynchronous, it will only execute the callback in a future iteration, after the
operation has completed. The code below it, however, will be executed
immediately. That code, since it's randomized, can take an undefined amount of
time to execute. Since it executes in the first iteration of our program, and
`fileHasBeenRead` will only execute in a later iteration, `fileHasBeenRead` will
not execute until *after* that randomized code has finished. This could be a very
long time.

When code that is scheduled to be run in a later iteration is blocked from
executing due to code in the current iteration taking too long to run, we say
that the event loop is "starved".

Sometimes it makes sense to deliberately schedule things to happen at a later,
but unspecified, time. While Node.js provides functions to do this, they're
poorly named, so alternatives are included in this library.

## Visual Example

Consider six functions, like this:

```js
function one() { console.log('one'); }
function two() { console.log('two'); }
function three() { console.log('three'); }
function four() { console.log('four'); }
function five() { console.log('five'); }
function six() { console.log('six'); }
```

Now, let's schedule all of these for future execution using the functions in
this library:

```js
thisTick(one);
laterTick(two);
thisTick(three);
laterTick(four);
thisTick(five);
laterTick(six);
```

Each iteration of the event loop can be thought of as a queue of things to
execute. Using this visualization, we can imagine what these queues would look
like before executing the code above:

```
Iteration 1
    thisTick(one);
    laterTick(two);
    thisTick(three);
    laterTick(four);
    thisTick(five);
    laterTick(six);

Iteration 2
    ....
```

At the end of executing all the code currently in Iteration 1, the state of the
queues will have changed, since our `thisTick` and `laterTick` functions add to
them. In addition, having executed the lines of code already presented removes
them from the queue. At this point, our queues look like this.

```
Iteration 1
    one();
    three();
    five();

Iteration 2
    two();
    four();
    six();
```

What our `thisTick` and `laterTick` functions have done is defer the execution
of our numbered functions into either later in the current iteration, or into a
future one. Since the odd numbered functions were passed to `thisTick`, they're
scheduled for execution in the current iteration. Since the even ones were
passed to `laterTick, they're scheduled for execution in a future iteration.

> **Note:** Calls to `laterTick` won't always schedule the tasks for the very
same, immediately-next iteration. Some of the future iterations may be already
spoken-for, for use in callbacks to I/O functions, or other asynchronous things.
Calls to `laterTick` inside one iteration aren't even guaranteed to all be in
the *same* future iteration. All you know is that they'll be executed in the
order in which they're scheduled (i.e. the order in which you call `laterTick`).

Since there are still three items left on the queue in Iteration 1, they will
now be executed, and thus popped off the queue, Once that's done and the queue
is empty, that iteration ends, and the process moves on.

When the process is in between the two iterations, our queues now look like
this:

```
Iteration 1
    [done]

Iteration 2
    two();
    four();
    six();
```

Ater Iteration 2 has finished executing, both queues are now cleared, and our
program has made the following output:

```
one
three
five
two
four
six
```

## License

See LICENSE.txt
