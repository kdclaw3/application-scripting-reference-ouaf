# Application Scripting Reference for OUAF

_An independent, unofficial reference._

This project is an informational reference. Its grammars, examples, and metadata
document scripting syntax and behavior. It is not offered or maintained as a
software library, parser, or runtime implementation. The materials are provided
under the MIT License, without warranty.

A language reference for **BPA scripts, server-based Edit Data scripts, and Groovy
integration**. It documents shared commands once and distinguishes their behavior
across script types and execution engines. Prose, formal grammar, examples, and a
structured concept catalog make up the reference.

## Script engine versions

The script type identifies the job a script performs. The engine setting selects
its execution model. The stored `SCR_ENGINE_VER_FLG` options are:

| Reference profiles  | Stored value | Engine setting                   | Applicable script types | Execution                                       | Groovy support                                                                       |
| ------------------- | ------------ | -------------------------------- | ----------------------- | ----------------------------------------------- | ------------------------------------------------------------------------------------ |
| `bpa-1`, `server-1` | `F110`       | Script engine 1.0                | BPA, service, plug-in   | Browser for BPA; server for service and plug-in | Service and plug-in: Groovy Members called with `invokeGroovy`; BPA: no Groovy steps |
| `server-2`          | `F120`       | Script engine 2.0                | Service, plug-in        | Server, XPath 2                                 | Groovy Members called with `invokeGroovy` alongside Edit Data                        |
| `server-3`          | `F130`       | Script engine 3.0                | Service, plug-in        | Server, XPath 2 with optimized evaluation       | Groovy Members called with `invokeGroovy` alongside Edit Data                        |
| `bpa-legacy`        | `F11C`       | Framework 2.1 compatibility mode | Legacy BPA              | Browser, legacy compatibility rules             | No Groovy steps                                                                      |
| `groovy`            | `F1GV`       | Groovy engine                    | Plug-in, Groovy library | Server, Groovy integration                      | Groovy-only execution; no Edit Data steps                                            |

The table groups library integration under `groovy`; it does not make `F1GV` the
only accepted library engine or establish a library-specific default. The engine
validator also accepts `F110`, `F120`, and `F130` for library records. Engine
acceptance and source-step choices do not prove that a complete library saves,
compiles, or executes. See [engine profiles](specification/engine-profiles.md).

**Service and plug-in scripts can use Groovy Members with engines 1, 2, or 3**
when Groovy is enabled in the host. Service scripts retain a numbered engine;
they cannot select the separate Groovy engine. The engine number does not select
the Groovy language version. See [Groovy integration](specification/groovy-integration.md).

**BPA as a script type accepts engine 1.0 and legacy compatibility mode.** Service
and plug-in scripts share Edit Data commands such as `move`, `if`, and `invokeSS`,
including when they use engines 2 and 3. Shared syntax does not make those server
scripts the BPA script type.

In the compatibility setting, **2.1 names a framework release**, not a fourth
numbered script engine. Both engines 2 and 3 use XPath 2; engine 3 does not mean
XPath 3. The Groovy engine setting is separate from embedding Groovy methods in an
otherwise Edit Data service or plug-in script.

## Profiles and scope

| Reference profile | What it describes                                                  |
| ----------------- | ------------------------------------------------------------------ |
| `bpa-1`           | Engine 1.0 browser conversion, execution, and structured steps     |
| `bpa-legacy`      | Legacy BPA compatibility differences                               |
| `server-1`        | Server execution with XPath 1                                      |
| `server-2`        | Server execution with XPath 2                                      |
| `server-3`        | Server execution with XPath 2 and engine 3 differences             |
| `groovy`          | Groovy-only script integration and its connection to mixed scripts |

These identifiers belong to this reference. They are distinct from stored engine
values, framework releases, script revisions, and the specification's own version.
Command entries describe applicability and behavior per profile. Browser
conversion restrictions must not be applied to server execution by assumption.

Each identifier has a [profile grammar and language contract](grammar/README.md).
The five Edit Data profiles select their supported command families from shared
grammar components. The server profiles currently share syntax while retaining
different expression and execution rules. Groovy uses its own language grammar
and the host integration contract.

Profile grammar selection describes this reference's supported-operation subset.
An excluded operation can still be recognized by the shared parser or become a
no-op; exclusion does not establish parser or application-save rejection.
The browser `branch` form remains in the grammar with an `unsafe` classification
because conversion discards its condition. Use `if` with `goto`; its example is
a caution. Server `branch` remains supported.

Groovy coverage describes the host integration, step roles, invocation contract,
approved expression-string construction, and API boundaries. The Groovy language
itself has a separate specification.

## Read the specification

- [Introduction and terminology](specification/introduction.md)
- [Engine profiles and compatibility](specification/engine-profiles.md)
- [Lexical structure](specification/lexical-structure.md)
- [Values and data areas](specification/data-model.md)
- [Execution model](specification/execution-model.md)
- [Structured steps](specification/structured-steps.md)
- [Groovy integration](specification/groovy-integration.md)
- [Scope and runtime requirements](specification/limitations.md)
- [Profile grammars and language contracts](grammar/README.md)
- [Shared Edit Data grammar](grammar/EditData.g4)

For example, this Edit Data body uses a quoted expression to read a temporary
variable:

```text
move 'ready' to $status;
move "$status" to $message;
terminate;
```

Examples omit the outer Edit Data wrapper unless a wrapper is the subject being
described. The normalized structured JSON examples describe the `bpa-1` browser
profile; they are not native application exports or a universal script format.

## Build the reference

Requires Node.js 22 or newer and npm. Dependencies are pinned in the lockfile.

```sh
npm ci
npm run check:reference
npm run build
```

The generated reference starts at `site/index.html`. Its `catalog.json` contains
language concepts, applicability, examples, and relationships for future indexing.
The [machine-readable contracts](metadata/profile-contracts.json) identify each
profile's grammar entry point, input representations, command applicability, and
language boundaries. Full command operands, behavior, constraints, and examples
remain in the command entries.
`npm run format` formats the authored files.

The development-only reference check compiles the shared and profile grammars,
checks explicitly mapped text and structured examples, and rejects incomplete or
invalid input. Generated parsers stay in ignored local output and are not a
library or public validation interface.

Reference version 0.5.0 uses profile-contract `schemaVersion: 2`, which includes the
`unsafe` applicability classification without removing syntactically accepted forms.

The preparation configuration matches no valid branch, so layer extraction
remains inactive.

## License

This reference is provided under the [MIT License](LICENSE).
Dependency licenses remain with their respective packages; see
[third-party tooling](THIRD-PARTY-NOTICES.md).
