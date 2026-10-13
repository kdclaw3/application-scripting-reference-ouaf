# Groovy integration

Groovy is a separate language integrated with the scripting host. This chapter
describes source steps, generated classes, invocation contexts, and library
interfaces. Use the [Groovy language documentation](https://groovy-lang.org/documentation.html)
for language syntax and choose the version matching the host's Groovy runtime.

## Two integration models

| Model                      | Engine setting   | Script types            | Data interface                                   |
| -------------------------- | ---------------- | ----------------------- | ------------------------------------------------ |
| Mixed Edit Data and Groovy | 1.0, 2.0, or 3.0 | Service, plug-in        | XML data areas and the script invocation context |
| Groovy-only                | Groovy (`F1GV`)  | Plug-in, Groovy library | Host-generated plug-in or library interface      |

A service script can contain Groovy methods while retaining a numbered engine.
It cannot select `F1GV`. BPA does not execute Groovy source steps. A BPA can call a
server script that uses Groovy, with the server performing that work.

Groovy-only scripts do not declare Edit Data data areas. Plug-in methods implement
the selected host extension interface; library scripts declare a reusable
interface and implementation.

Library source belongs to the `groovy` reference grouping, but that grouping does
not require every library record to select `F1GV`. The engine validator accepts
numbered engines for library scripts as well; see [engine profiles](engine-profiles.md).
Engine acceptance, available source-step choices, and successful compilation or
execution are separate checks.

## Source step roles

- **Groovy imports** contribute permitted imports to generated source.
- **Groovy members** contribute fields and methods to the generated class.
- **Groovy interface** describes the public contract of a Groovy library.

These are source contributions rather than sequential Edit Data operations. A
members block can define a method without executing it at the block's position.
The host assembles and compiles a class with the appropriate superclass and
interfaces, using static compilation.

For example, a members source step can contain:

```text
groovy members
  String message = ''

  public void prepareMessage() {
    message = 'ready'
  }
end-groovy-members;
```

A mixed script can call that method from Edit Data:

```text
invokeGroovy 'prepareMessage';
```

This changes the object's member field. It does not create an Edit Data variable
named `message` or automatically return that value to the caller.

An imports source step has a separate delimiter:

```text
groovy imports
  import java.math.BigDecimal
end-groovy-imports;
```

An import does not grant permission to use an API. The host's permitted classes
and methods determine which source can compile and execute.

## Mixed-script invocation contract

`invokeGroovy` names a public method with no arguments on the current script's
Groovy object. Use a literal method name. Grammar acceptance of a variable-shaped
operand does not establish dynamic method-name resolution.

Before invocation, the host makes the current XML root, data-area schema
information, and invocation context available to the object. Host helpers expose
script variables, XML operations, and service calls through that context. The
statement ignores a Java or Groovy return value; output belongs in the script's
context or data interface.

Application errors raised by the method propagate through the server call.
Reflective invocation failures are host errors. Query resources opened through
the integration are released as part of its invocation lifecycle. These
operations do not give the script a browser context.

## Constructed expression arguments

The helper and argument tracking described here are available in supporting host
releases. Confirm both on the target host; a numbered script engine or Groovy
language version alone does not establish their availability.

The host helper `concatenateGroovyStrings(String... fragments)` joins string
fragments without a separator. It constructs text; it does not evaluate XPath or
escape values for insertion into an expression. This is a host API available to
Groovy members, not an Edit Data command or a Groovy language keyword.

Its result can supply restricted expression arguments to host methods such as
`evalString`. A local variable declared or assigned from the helper, and an alias
of that variable, can also supply these arguments. For example, inside a mixed
script's Groovy member method:

```groovy
String path = concatenateGroovyStrings('request/', 'status')
String selectedPath = path
String status = evalString(selectedPath)
```

This example requires a host release that supplies the helper and its argument
tracking, and a declared `request` data area with a `status` value that can be read
as a string. Construction produces `request/status`; `evalString` reads
it through the current script's XML invocation context. The local Groovy variable
`status` does not automatically become an Edit Data variable.

The helper returns `null` when called with no arguments or a null argument array.
With one argument it returns that argument. With multiple arguments it joins
their string values without a separator. A constructed string still needs to be
a valid expression for the consuming host method.

Arguments to the helper must themselves satisfy the host's expression
restrictions. An ordinary variable initialized from a string literal does not
gain the same eligibility as a helper-result variable. Neither an arbitrary
variable nor a dynamic method result is accepted merely because its runtime
value happens to be a string. Use the supported construction and assignment forms
with eligible fragments; they do not establish permission for arbitrary dynamic
expressions or additional host APIs.

## Plug-ins and libraries

A Groovy-only plug-in implements the methods required by its configured extension
point. Its generated base class supplies associated data and host services.
A method name for one extension point is not a general entry point for all
plug-ins.

A Groovy library separates its interface from its members implementation.
Consumers use the host's library-loading contract. Interface availability and
compatibility depend on the selected script revision and host configuration.
The library is not an Edit Data data area or a browser BPA.

## Runtime and API boundaries

Record the actual Groovy runtime version separately from the `F1GV` engine code.
That code does not select a major Groovy language release. Available syntax,
standard-library behavior, generated interfaces, and permitted APIs depend on the
host release and configuration.

The host restricts imports and method usage. The presence of a Java class on the
server does not make it part of the script API. This reference describes the
boundary and the context passed across it; it does not enumerate every Java class
or implement host service contracts.
