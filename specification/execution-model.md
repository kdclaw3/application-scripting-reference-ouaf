# Execution model

The host expands BPA text and structured steps into browser instructions. Server
scripts execute parsed actions against a server invocation context. Groovy-only
scripts execute through generated host interfaces, while mixed scripts bridge
from Edit Data into Groovy. Shared syntax does not imply a shared execution path.

## Browser branches, labels, and loops

The following browser behavior applies to `bpa-1`. Legacy record conventions are
described in [engine profiles](engine-profiles.md).

`if` chooses a body and rejoins after it. Only a condition result equal to `true`
takes the true path in this profile; general XPath value truthiness must not be
assumed. `goto` transfers to its destination without an automatic return.

Textual `branch` does not retain its condition during conversion. Omitting its
false target also causes conversion to fail. Use `if` with explicit `goto`
statements for conditional transfer:

```text
if ("$ERROR")
  goto failed;
end-if;
goto finished;
failed: move 'failed' to $status;
finished: terminate;
```

A standalone textual `label` and a nested `edit data ... end-edit` block produce
no execution instructions. A jump to a label prefix on either construct has no
usable destination. Attach labels to emitting statements, and write Edit Data
body statements directly. An authorable structured label remains a distinct step.

`for` visits the selected nodes and may execute zero times. The loop variable
holds the current node during the body and is cleared after a loop that has
iterated finishes. That cleanup rule does not establish that an empty selection
clears a previously assigned value. Do not use the loop variable to retain a
result; assign a separate variable for that purpose.

Assignments made only inside a loop do not necessarily happen. Quotes inside
selection predicates can be removed during conversion, changing their meaning.
Dynamic and variable-based selections require the intended XML context. Iteration
state is retained when a jump leaves the loop, so re-entry is not equivalent to
starting a new loop. Keep ordinary control flow within its enclosing block.

## Browser calls, transfers, and stopping

`performScript` shares temporary variables and data areas with its callee. Normal
completion resumes the caller. A callee that terminates or transfers control can
prevent that return; its changes to shared state remain relevant to the caller.

`transferControl` starts a replacement script, resets the call stack and data
areas, and retains temporary variables. Sequential caller statements do not resume.

Plain `terminate` stops the whole BPA, including active callers. Textual error
and map payloads are discarded during conversion, leaving the stopping operation.
They do not display an error or produce a map result. Use plain termination for
this profile. The shared error syntax uses substitution indexes starting at one;
index zero is not a valid substitution slot even though the resulting payload is
discarded on this BPA path.

## Browser invocations and interaction

Edit Data invocations update system-provided outcome and message variables, then
continue at the next statement on success or a handled failure. Test `$ERROR`
explicitly when subsequent work depends on success. Structured invocation steps
have separate success and error destinations.

With no warning clause, or with `suppress`, warnings are ignored. `with warn`
without another mode and `asError` treat warnings as errors. `popup` requests user
confirmation.

`invokeMap` defaults to a popup; generated edit maps default to the page. Explicit
display targets choose the requested surface. Navigation, maps, prompts, and button
actions depend on the host interface. A named target must exist and be accessible
in that host, with the required data schema and operation.

## Server control flow

Server `if` and `branch` evaluate a scalar condition. The text `true` or `false`
is accepted without regard to case, and a blank result is false. Other scalar
values are rejected; general XPath or JavaScript truthiness is not substituted.
Server `branch` retains its condition and targets. A false condition falls through
when no false target is supplied.

A server textual label is a targetable no-op. A nested Edit Data block executes
its body. An action marked `*DISABLED*` skips its operation and continues with the
next action. These server rules differ from the browser conversion restrictions.

Server `for` iterates a collection, or executes once for a non-null scalar result.
It performs no iterations for null or an empty collection. The local loop variable
retains the last assigned item after an iterated loop; an empty selection makes
no new assignment. The browser's post-loop clearing behavior is not a server rule.

Plain server `terminate` ends the active script invocation. `terminate with error`
constructs a host error using message identifiers, substitutions, and optional
element context. Message substitutions start at one. This requires the referenced
messages and schemas; the browser's discarded error payload does not apply here.

## Server calls and Groovy

Server `invokeSS`, `invokeBS`, and `invokeBO` call host operations with declared
data-area contexts. Targets, schemas, access, errors, and warnings follow the
server invocation contract. They do not supply browser popups or an automatic BPA
UI outcome flow. Navigation, maps, `performScript`, and `transferControl` remain
browser operations even when their syntax can be parsed on a shared path.

In a mixed server script, `invokeGroovy` calls a public zero-argument method on the
current script's Groovy object. The host supplies the XML root, schema metadata,
and invocation context before calling it. The statement does not assign a method's
return value. See [Groovy integration](groovy-integration.md).

## XPath 2 errors and cleanup

In `server-2` and `server-3`, a cleanup failure can replace an earlier expression
error. A result-sequence close error can replace an iteration error, and a query
close error can replace an execution or result-sequence close error. Those earlier
errors are not automatically retained as suppressed exceptions.

## Loading and execution

Authoring, loading, conversion, compilation, and execution are separate stages. A host can allow
a script to be saved while later loading or conversion fails. Successful
conversion also does not supply an external target, grant permission, or satisfy
the target's data requirements.
