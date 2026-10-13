# Scope and runtime requirements

This reference covers shared Edit Data statements, their browser and server
profiles, legacy BPA compatibility, and Groovy integration. Applicability belongs
to a profile and script type. An engine setting alone does not identify every
runtime behavior.

## Browser runtime requirements

The execution model depends on a browser environment with XML DOM, XPath, and XSLT
support, together with host-provided variables, data schemas, UI controls, and
service operations. Availability of those browser APIs alone does not establish
compatibility with the host's expression handling.

Scalar expression handling expects transformation output in a particular node
shape. Additional nodes inserted by a browser, such as transformation notices,
can change which node is read and prevent a value or condition from being
interpreted correctly. A compatible host must preserve the expected output shape.

## Server and Groovy runtime requirements

Server engines require the host's invocation machinery, schemas, expression
functions, context variables, and authorized service targets. Engine 1 uses
XPath 1; engines 2 and 3 use XPath 2 for engine-selected expressions. Data-area
destinations and some internal selections follow narrower path rules.

Changing engines can affect numbers, result cardinality, node identity, and
expression handling. Optimized evaluation does not establish identical internal
behavior for every program.

Groovy requires a host-compatible runtime, permitted imports and methods, and the
correct generated interface. Groovy-only and mixed numbered-engine scripts have
different data interfaces. The full Groovy language and application-specific Java
APIs are separate from this integration reference.

## Profile boundaries

Profile grammars define selected Edit Data body syntax. The shared parser surface
also includes forms excluded from a profile's authoring grammar. Parser acceptance,
profile eligibility, conversion or compilation, and execution are distinct stages.
A parsed command can still require a data schema, valid operands, an available
target, or an enabled host feature.

Profile selection is the reference's supported-operation subset. An excluded
operation may still parse or become a no-op. Its exclusion does not establish
parser rejection or application-save rejection. Source-step choices likewise
describe editor selection and do not by themselves define Edit Data acceptance.

All Edit Data grammar entry points require a complete body, balanced parentheses,
and matching block delimiters. These profile-authoring syntax contracts cover
complete bodies; parser error recovery and partial-input handling are outside
their scope. Outer script containers and standalone Groovy source blocks are
outside the Edit Data body entry point.

Quoted XPath remains an expression-language boundary, and Groovy source is governed by its own compiler.
The profile contracts do not claim that a native legacy storage format is the
same as the normalized browser JSON notation.

- Compatibility mode changes disabling, null moves, and empty selections. Its
  documented differences belong to `bpa-legacy`, rather than redefining `bpa-1`.
- Shared syntax can include forms that lose information during BPA conversion.
  The command's applicability and behavior describe those restrictions.
- Dynamic targets, external scripts, UI actions, and service operations depend on
  host configuration. Their implementations are outside this reference.
- XML content, namespaces, extension functions, field types, and schema defaults
  determine expression and data-path behavior in a particular application.
- Structured JSON examples describe `bpa-1` concepts rather than a native transfer
  format. They do not enumerate every server or Groovy step format.
- Groovy source blocks contribute separate-language source. Their inclusion does
  not make Groovy part of the Edit Data expression grammar.

## Reading examples

Usage examples show a command's ordinary form. A form classified `unsafe` remains
in the grammar to describe accepted syntax with unreliable execution semantics;
it is restricted to caution examples. In browser profiles, textual `branch`
discards its condition during conversion: use `if` with `goto` instead.
Names such as `ExampleTask` stand
for application-provided targets, and data paths require corresponding host
schemas. Caution examples deliberately show restricted or non-emitting forms and
must be read with the accompanying explanation.

The catalog inventories the forms described here. It does not claim every form in
every historical release, extension point, or application API. Host release,
engine setting, script revision, and Groovy runtime version are distinct inputs.
Layer extraction and application integration are separate from the specification.
