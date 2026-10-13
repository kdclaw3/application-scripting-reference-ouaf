# Values and data areas

Temporary variables carry intermediate values, which may include node references.
Data areas provide named XML-shaped schema contexts. Expressions can select nodes
or calculate values. Field types, schema defaults, and business rules are supplied
by the host application.

## Assignment in the browser profile

This section describes `bpa-1`. Server differences follow below; legacy null
handling is described in [engine profiles](engine-profiles.md).

`move` copies or clears a destination; `null` clears the selected target. Read a
temporary variable with `move "$source" to $destination;`. A bare `$source` in
that position converts to a data-area source named `source` instead.

Moving an XML node into a temporary variable can preserve the node reference
rather than convert it into text. Subsequent reads can therefore refer to that
same node. Use an expression yielding a string when a text value is required.

`evaluate(...)` requests dynamic interpretation. `escape(...)` is present in the
shared syntax, but its escaping instruction is discarded during BPA conversion.
It does not provide an escaping operation. A double-`$` move source fails
conversion, while a double-`$` destination becomes a data-area destination.

`default` supplies a default value without unconditionally replacing an existing
temporary value. Temporary-variable lookup can fall back to a UI global when the
temporary value is absent or empty. A value assigned only in one branch is not
necessarily available after the branches rejoin.

## Browser system-provided names

The host supplies these names for expression lookup with a single `$` prefix.
Their availability and values depend on the current operation and UI context.

| Names                                                               | Meaning and boundary                                              |
| ------------------------------------------------------------------- | ----------------------------------------------------------------- |
| `ERROR`, `WARNING`                                                  | Invocation outcome state maintained by the host.                  |
| `ERRMSG-CATEGORY`, `ERRMSG-NUMBER`                                  | Current invocation message identifiers.                           |
| `ERRMSG-TEXT`, `ERRMSG-LONG`                                        | Current short and long message text.                              |
| `ERRMSG-ELEMENT`, `ERRMSG-FIELD`                                    | Current message's element and field details.                      |
| `ERRMSG-ALERTROW`, `ERRMSG-PRIMEKEYS`                               | Current message's row and key details.                            |
| `MAP-VALUE`                                                         | Host-maintained map result.                                       |
| `BLANK`, `NEWLINE`, `SPACE`                                         | Empty string, line-feed character, and space.                     |
| `SINGLE-QUOTE`, `DOUBLE-QUOTE`                                      | The corresponding quote character.                                |
| `PARM-NOT-SET`                                                      | Host sentinel for an unset parameter.                             |
| `CONTEXT-PREMISEID`, `CONTEXT-ACCOUNTID`, `CONTEXT-PERSONID`        | Selected identifiers from current UI context. They may be absent. |
| `CURRENT-DATE`                                                      | Current application date in its internal representation.          |
| `CURRENT-STD-DTTM`, `SYSTEM-DATE`                                   | Host-provided standard date-time and system date.                 |
| `DEVICE-OS`, `DEVICE-BROWSER`, `DEVICE-DISPLAY-TYPE`, `DEVICE-INFO` | Device descriptors; unavailable descriptors can be empty.         |

Assigning a temporary variable with a predefined name does not guarantee that
later reads override the name's predefined lookup behavior.

## Data-area paths and declarations

Declaration commands introduce aliases for host schemas. Declaring an existing
alias replaces its current data. An alias must be a usable XML element/path name;
leading underscores are permitted. A declaration on only one branch does not
make the alias available on every path after a join.

A move destination is a **data-area path**, not unrestricted XPath. Its first
segment names the data area. Later segments navigate descendants; a `+name`
segment can append a list item below the root. A final `*` requests matching by
name, and a trailing `@name` identifies an attribute. The target schema determines
which elements, lists, and attributes exist.

```text
move 'new' to "request/+items/item";
move 'id' to "request/item/@id";
move 'value' to evaluate('request/value');
```

`+items/item` incorrectly places the append marker at the root. Leading `/` is
also outside this action-path language. An expression can be valid XPath while
being unsuitable as a move destination.

## Server variables and assignment

Server profiles keep temporary variables in the active invocation context.
Use a quoted expression such as `"$source"` for a temporary-variable read. A bare
`$source` token is not interchangeable with that expression. The `$$name` form
addresses host context variables for supported operations; it is not a browser
global.

Server `evaluate(...)` and `escape(...)` retain their action behavior. The browser
conversion's discarded escape flag does not describe the server operation.
Context variables, schema fields, and temporary variables have separate storage
and access rules.

When assigning an XML element to a temporary variable, engine 3 copies the element
into a separate document. Engines 1 and 2 do not perform that engine-3 copy at this
assignment point. Later mutation visibility and node identity must therefore be
read with the engine profile. Scalar values and XML elements are distinct values.

For a direct variable-to-variable move such as `move "$source" to $destination;`,
engine 2 preserves the source element's identity: later changes
through either variable affect the same node. Engine 3 isolates the assigned
element, so changes to the source do not change that copy.

Selecting a node through XPath is a separate operation. Engine 2 imports the
input document during evaluation, while engine 3 reuses a native input document
and then copies the selected element on assignment. Both paths
therefore produce a detached assigned element. The absence of a
copy at one stage does not establish aliasing across the complete expression and
assignment path.

Server system values come from the request, session, and application context.
The browser table above is not a portable list of server variables. Process date,
current date, user, and language have their own server bindings and formatting.

## Expressions and Groovy values

The browser model uses XPath 1 expressions and XSLT transformations. Server engine
1 uses server-side XPath 1 evaluation; engines 2 and 3 select XPath 2 for expression
evaluation. Some path and schema operations use narrower selection rules.

Expression meaning depends on namespaces, functions, variable bindings, result
cardinality, and the XML context. A valid expression does not supply a schema or
make a destination writable.

### XPath 2 result conversion

For `server-2` and `server-3`, the evaluated expression passes through a conversion
boundary before its result reaches the surrounding action. An empty sequence
becomes null, one item becomes a single value, and multiple items become an ordered
list. Element results can remain XML nodes.

The following conversions apply at this boundary. Subsequent actions and
destination schemas can impose additional conversions.

| XPath result                            | Value at the evaluation boundary                                         |
| --------------------------------------- | ------------------------------------------------------------------------ |
| `xs:integer`, such as `1 + 2`           | Decimal numeric object after a signed 32-bit integer conversion.         |
| `xs:double`, such as `xs:double('2.5')` | Double-precision numeric object.                                         |
| `xs:boolean`                            | Boolean value.                                                           |
| `xs:decimal` and `xs:int`               | Atomic text. These types do not take the `xs:integer` conversion branch. |
| Element                                 | XML node; identity depends on the engine and input document.             |
| Text node                               | Serialized text.                                                         |
| Attribute selected directly             | Serializing a standalone attribute can raise `SENR0001`.                 |

The integer conversion rejects `2147483648`, despite that value being a valid
XPath integer. Use `string(@code)` when the intended result is the attribute's
text: this expression returns that value without serializing a standalone
attribute node.

The exact XPath type determines the conversion; numeric subtypes need not share
the same representation. See [scope and runtime requirements](limitations.md) for
profile and expression-language boundaries.

Mixed Groovy scripts receive the server script's XML and invocation contexts.
Groovy member fields are not automatically Edit Data temporary variables.
Groovy-only plug-ins and libraries use their host-generated interfaces instead of
declared Edit Data data areas. See [Groovy integration](groovy-integration.md).
