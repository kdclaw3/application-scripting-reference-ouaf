# Lexical structure

The shared Edit Data syntax uses case-sensitive keywords. Statements end with a semicolon. Whitespace separates
tokens; line breaks may occur between tokens. A `//` comment is a statement-level
item that runs to the line end. It is allowed between statements and inside blocks,
but cannot split a statement, its label prefix, or its disabled marker.

## Quoted values

Single-quoted text is a literal; double-quoted text is an expression. Semicolons
and comment markers inside quotes do not end the value. The grammar recognizes
backslash escapes for quotes, backslashes, whitespace, Unicode, and octal forms.
Recognition of an escape does not establish runtime decoding.

In `bpa-1`, Edit Data conversion preserves raw quoted contents in several operations.
For example, a backslash-escaped quote can remain in an XPath expression and make
that expression invalid. Literal move sources also undergo `%NAME` text
substitution, so a literal is not necessarily displayed unchanged.

Loop-selection, invocation-data-area, map-data-area, and dynamic-target conversion
can remove quote characters inside expressions. A predicate such as
`items/item[@state='open']` can become `items/item[@state=open]`, which compares
against an expression instead of the intended string. Host framing and indentation
can also affect multiline literals; do not use them as a byte-preserving container.

These conversion restrictions belong to the browser profile. Server actions retain
their expression operands and use the selected expression engine; browser quote
loss is not a common language rule.

## Variables

A temporary variable token starts with `$`, then a letter, followed by letters,
digits, underscores, dots, or hyphens. Expression variable lookup has narrower
name handling than the token grammar; dotted names are not guaranteed to resolve
as one browser variable.

Use a quoted expression when reading a temporary variable in a move:

```text
move 'ready' to $value;
move "$value" to $copy;
```

A bare `$value` source in `bpa-1` instead converts to a data-area source named `value`.
The single-`$` form remains the ordinary temporary-variable destination.

Server evaluation also distinguishes a bare token from the quoted variable
expression. Use the quoted form to read a temporary variable across profiles.

`$$value` is a server-context form, not a BPA UI-global prefix. In `bpa-1`, a double-`$`
move source fails during conversion; a double-`$` destination becomes a data-area
destination. Single-`$` expression lookup can consult UI globals when a temporary
value is absent or empty. See [values and data areas](data-model.md).

## Labels and disabling

A statement label precedes a colon and can be an integer, identifier, or an allowed
keyword. Block delimiters (`else`, `end-if`, `end-for`, `end-edit`) are not label
keywords. `STATEMENT_BLOCK` is reserved. A textual `label` statement accepts quoted
text or an allowed keyword, not an arbitrary bare identifier.

In browser execution, labels share a namespace across the whole script, including
structured-step sequences and identifiers inside every Edit Data step. In `bpa-1`,
a label prefix attached to an emitting statement can be a jump target. A standalone
textual `label` statement produces no instruction, so its prefix does not create a
usable jump target.

Server execution resolves a jump in the current statement block and its enclosing
blocks, including enclosing step sequences. It cannot enter an inaccessible nested
or sibling block, or the internal labels of another Edit Data step. A duplicate
label within one block is invalid. Script-wide save validation can accept a label
reference that is out of scope when the jump executes; passing that validation
does not establish an executable target. A server textual label action is a
targetable no-op, and a nested Edit Data block executes its body.

`*DISABLED*` occurs before the optional label. In `bpa-1`, an individual statement's marker
does not suppress its conversion or execution. Disabling an entire
structured step is a separate operation: the disabled step advances to the next
sequence. Server actions honor the individual disabled marker by skipping the
operation and continuing to the next action. Legacy compatibility also changes
comment-based handling of stored step text; see [engine profiles](engine-profiles.md).

## Groovy source boundaries

Groovy imports, members, and library interfaces have dedicated source blocks.
Their delimiters belong to the script container; their bodies use Groovy syntax.
The `invokeGroovy` statement appears in an Edit Data body in a mixed server script.
See [Groovy integration](groovy-integration.md).
