# Engine profiles and compatibility

The five stored engine settings map to six reference profiles because engine 1.0
has distinct browser and server execution paths.

Each profile has a grammar entry point and a structured language contract. In the
generated reference, open a profile from the overview table. In the repository,
start with the [profile grammar index](../grammar/README.md). The contract combines
syntax with command eligibility and runtime rules; sharing a grammar does not
make two execution profiles interchangeable.

| Profile      | Stored setting | Script types            | Expression environment                   |
| ------------ | -------------- | ----------------------- | ---------------------------------------- |
| `bpa-1`      | `F110`         | BPA                     | Browser XML, XPath 1, and XSLT support   |
| `bpa-legacy` | `F11C`         | Legacy BPA              | Browser compatibility behavior           |
| `server-1`   | `F110`         | Service, plug-in        | Server XPath 1                           |
| `server-2`   | `F120`         | Service, plug-in        | Server XPath 2                           |
| `server-3`   | `F130`         | Service, plug-in        | Server XPath 2 with optimized evaluation |
| `groovy`     | `F1GV`         | Plug-in, Groovy library | Host-managed Groovy runtime              |

Engine 1.0 is the default for BPA. Engine 3.0 is the default for service and
ordinary Edit Data plug-in scripts. These defaults do not establish a special
Groovy-engine default for library scripts.
A service script can contain Groovy methods while retaining its numbered engine;
it cannot select the Groovy-only engine setting.

The `groovy` profile groups Groovy plug-in and library integration. A library
record is not universally required to select `F1GV`: the engine validator accepts
`F110`, `F120`, and `F130` for library scripts, rejects `F11C`, and accepts `F1GV`
when the host's Groovy feature is enabled. The library step selector exposes
imports, members, and interface contributions separately from that validator.
Neither engine acceptance nor a step appearing in the selector proves that a
complete library configuration passes save checks, compiles, or executes.

## Engine 1.0 browser and server

Both paths use XPath 1 expression behavior, including floating-point arithmetic.
They do not share an execution mechanism. The browser receives expanded BPA
instructions, while the server executes parsed actions against an invocation
context. UI controls, browser globals, and BPA call-stack behavior belong to the
browser profiles.

For `bpa-1`, conversion restrictions include discarded textual termination
payloads, non-emitting textual labels and nested Edit Data wrappers, and ignored
individual disabled markers. These are described in the relevant command entries.
They must not be generalized to `server-1`.

## Engine 2.0 and engine 3.0

Both profiles use XPath 2 for their engine-selected expression evaluation. Engine
3 adds optimized evaluation; it is not an XPath 3 profile. Some internal path and
schema operations still use the host's simpler path rules rather than the full
expression language.

One observable distinction concerns temporary variables holding XML elements:
engine 3 copies an element into a separate document on ordinary assignment to a
temporary variable. Engines 1 and 2 do not perform that engine-3 copy at this
assignment point. A program must not assume identical node identity or later
mutation visibility across those profiles.

Evaluation and assignment must be distinguished: an engine 2 XPath evaluation can
already import the input document before assignment. Direct variable-to-variable
assignment and assignment from an XPath selection can consequently have different
identity outcomes. See [values and data areas](data-model.md) for these paths
and result conversions.

The server profiles share control-flow actions, including conditional branches,
disabled-action skipping, and error termination. A newer engine number does not
make browser-only interaction commands available on the server.

## Framework 2.1 compatibility mode

The number 2.1 identifies the older framework behavior being preserved. It is not
an XPath version or an engine between 2.0 and 3.0. The `bpa-legacy` profile is for
legacy BPA records, whose stored operands and presentation fields can differ from
modern Edit Data output.

The compatibility path includes these distinctions:

- A leading `//` in a step's descriptive text does not trigger the ordinary
  browser path's comment-based step skip.
- A null move is recognized through the legacy `%NULL` source value in a
  data-area-to-data-area move, instead of the ordinary null source kind.
- When the simple node-selection path reaches its empty-result case, it yields
  an empty string rather than the ordinary path's null value. Browser fallbacks
  and scalar expression evaluation have separate paths.

These rules describe compatibility behavior; they do not make `bpa-legacy` an
alias for `bpa-1` or an instruction to convert modern examples into old records.

## Groovy engine and mixed scripts

The Groovy engine supports Groovy plug-ins and library integration. Their generated
interfaces avoid the Edit Data XML conversion path. Groovy-only scripts do not
declare Edit Data data areas. The library grouping here describes source and
integration contracts; it does not impose an exclusive engine setting on library
records.

Numbered-engine service and plug-in scripts can instead embed Groovy members and
invoke them from Edit Data. Their XML context remains active. See
[Groovy integration](groovy-integration.md) for the two models and their API
boundaries.
