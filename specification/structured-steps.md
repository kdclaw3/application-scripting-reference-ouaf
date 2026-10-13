# Structured steps

The JSON representation in this reference describes `bpa-1` browser concepts.
It is not a native export or a universal schema for server and Groovy scripts.
Each step has `sequence`,
`kind`, `fields`, and an optional `enabled` flag. Sequence values are positive,
unique integers. The representation's schema is `schemas/steps.schema.json`.

## Authoring and expansion

The entries combine interaction and control steps marked `authorable` with
instructions marked `expansion-only`. The latter include navigation with refresh,
loop instructions, generated map forms, declaration forms, and variable defaults.
These categories describe the stage at which the reference presents each form;
a particular host can expose a different set of authoring choices.

A textual `label` produces no Edit Data instruction. A structured label record
still has a sequence and descriptive text. A structured Edit Data record provides
the container whose body the host expands; writing another `edit data` wrapper
inside that body does not create another active container.

## Script-wide flow

Execution order follows sequence values, not array order. In `bpa-1`, a disabled
whole step advances to the next sequence. Individual `*DISABLED*` text markers
inside an enabled Edit Data step do not disable those statements.
Disabling a whole Edit Data step still leaves its text subject to parsing,
expansion, and label validation: malformed syntax can prevent script loading,
and its registered labels remain targets.

Edit Data labels and structured sequences share a script-wide namespace. An Edit
Data `goto` may reference another step sequence. Structured target fields name
actual structured sequences, rather than textual identifiers or internal expanded
instructions. Variables and data areas can persist across Edit Data steps, so
labels, jumps, stopping paths, and shared state belong to the whole script.

Structured invocation and function steps require success and error destinations.
There is no implied third fallthrough destination. Prompt choices have local
sequence targets; at most one choice is the default. Choice rows can also accompany
input, focus, and map interaction. Continue on input or focus advances to the next
sequence; selecting a configured choice instead uses that choice's target. A map
return that matches no choice also advances to the next sequence. Closing a map
is a separate path: without a default continuation, closing can stop execution.
An expanded loop's body begins at the following step and has an explicit exit
target. External script and navigation targets are names, rather than local
sequence references.

## Server and Groovy steps

Server scripts also contain ordered steps, including Edit Data and, where allowed,
Groovy source contributions. Their engine controls expression evaluation and
their script type determines the permitted step kinds. Browser interaction
does not become available on the server by selecting engine 2 or 3.

Groovy imports, members, and library interfaces contribute source to generated
classes. They are not covered by the browser JSON examples. Their roles and
invocation model are described in [Groovy integration](groovy-integration.md).

Legacy compatibility has distinct stored-step conventions. The normalized
`bpa-1` examples do not redefine legacy fields or their execution behavior.

## Fields and host behavior

Each entry describes required and optional fields. Field types and enum values
belong to this normalized representation. They do not expose host database column
names or the full schemas of application targets.

Interaction steps depend on the host's UI, available controls, and permissions.
The `errorScript` field on a structured termination record describes an optional
host error action; its behavior is outside this profile. It does not add error
semantics to textual `terminate with error`.
