# Profile grammars

Select the profile ID before choosing a grammar. Each profile has a language
contract, an entry point, and command applicability. The contract remains necessary
after syntax recognition: it describes operand restrictions, conversion effects,
and execution requirements that grammar alone cannot express.

| Profile ID                           | Language entry point                                                          | Additional representation                              |
| ------------------------------------ | ----------------------------------------------------------------------------- | ------------------------------------------------------ |
| [`bpa-1`](bpa-1/README.md)           | [`Bpa1.g4`](bpa-1/Bpa1.g4), `program`                                         | Normalized browser steps                               |
| [`bpa-legacy`](bpa-legacy/README.md) | [`BpaLegacy.g4`](bpa-legacy/BpaLegacy.g4), `program` for Edit Data bodies     | Legacy stored steps have their own compatibility rules |
| [`server-1`](server-1/README.md)     | [`Server1.g4`](server-1/Server1.g4), `program`                                | Groovy source contributions in mixed scripts           |
| [`server-2`](server-2/README.md)     | [`Server2.g4`](server-2/Server2.g4), `program`                                | Groovy source contributions in mixed scripts           |
| [`server-3`](server-3/README.md)     | [`Server3.g4`](server-3/Server3.g4), `program`                                | Groovy source contributions in mixed scripts           |
| [`groovy`](groovy/README.md)         | Host-compatible [Groovy language](https://groovy-lang.org/documentation.html) | Source-step containers and host integration            |

## Shared components and profile selection

The five Edit Data grammars import [EditData.g4](EditData.g4), which provides common lexical
and parser rules. Resolve that import from this directory. Each profile replaces
the statement selection while inheriting the complete-input `program` entry point.
Unsupported command families are excluded from that profile's statement rule.
This is the reference's supported-operation subset. Exclusion does not mean the
shared implementation parser rejects the text or the application refuses to save
it: an excluded operation can still parse or become a no-op.
Parentheses and block delimiters must be balanced. These are profile-authoring
contracts for complete bodies. Parser error recovery and partial-input handling
are outside their scope.

The server grammars currently select the same syntax. Their expression environments
and execution rules differ. Sharing syntax is an explicit part of the reference;
it does not make the profiles interchangeable.

`EditData.g4` retains the shared parser surface, including commands unavailable in some
profiles. Use it to understand common syntax, then use the named profile grammar
and contract for authoring. Parsing a form with the shared grammar does not establish
that a particular engine executes it.

## Accepted syntax and execution

Profile grammars retain accepted `no-step` forms where conversion emits no browser
operation. Their command entries describe this behavior. Other commands can be
`limited`: the syntax is present, but operands or effects have restrictions.
An `unsafe` form remains syntactically available but must not be presented as a
usage example. Browser textual `branch` is unsafe because conversion discards its
condition; use `if` with `goto`. The server `branch` operation remains supported.

The [`bpa-legacy`](bpa-legacy/README.md) Edit Data grammar is not a native legacy
record grammar and does not promise a modern-text-to-legacy round trip. The
[normalized browser JSON schema](../schemas/steps.schema.json) describes `bpa-1`
examples, not every browser storage format.

## Language boundaries

- Quoted XPath is a token in an Edit Data grammar. XPath syntax, functions, and
  evaluation depend on the profile's expression environment.
- Groovy bodies use the Groovy language and host compiler. No Edit Data grammar
  substitutes for its syntax or permitted API rules.
- Groovy source-step delimiters and interfaces belong to the
  [integration contract](../specification/groovy-integration.md).
- Every Edit Data grammar requires the complete body to be consumed. Invalid
  trailing text is not an extension of a valid program.

The [profile contracts](../metadata/profile-contracts.json) are the machine-readable
counterpart. Detailed command operands, behavior, restrictions, errors, and examples
remain in the [command reference](../metadata/commands.json).
