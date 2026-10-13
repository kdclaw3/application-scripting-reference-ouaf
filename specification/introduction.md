# Introduction and terminology

This reference describes the shared Edit Data scripting syntax and its use in
BPA, service, and plug-in scripts, together with Groovy integration. It describes
both the broader scripting facility and the specific **BPA script type**.

## Script type, engine, and language

- A **BPA script** orchestrates an interactive browser workflow. Its service and
  business-object invocations are performed by the server.
- A **service script** runs on the server and exposes a schema-shaped interface.
- A **plug-in script** runs at a host-defined extension point, whose interface
  determines its inputs and outputs.
- A **Groovy library script** supplies a reusable Groovy interface and implementation.
- **Edit Data** identifies the statement language used in script steps. XPath
  expressions supply selections and calculated values inside those statements.
- An **engine setting** selects execution behavior. The same statement can behave
  differently after browser conversion and during direct server execution.

The [engine profiles](engine-profiles.md) distinguish `bpa-1`, `bpa-legacy`,
`server-1`, `server-2`, `server-3`, and `groovy`. These are reference identifiers,
not stored application codes or claims of an independent language standard.

## Representations

1. **Authored script records** contain ordered steps, configuration, and data-area
   declarations appropriate to their script type.
2. **Edit Data text** contains statements in a step body. The host can surround
   that body with a wrapper when preparing the whole script.
3. **Server actions** retain the parsed operations and execute against a server
   invocation context.
4. **Browser instructions** result from BPA conversion. That conversion can
   discard a field or an entire textual construct.
5. **Groovy source steps** contribute imports, members, and, for a library,
   interface declarations to host-managed Groovy compilation.

The normalized JSON step examples describe `bpa-1` concepts. They are not native
application records and do not enumerate every server or Groovy step format.

## Reading command entries

Read a command's common purpose and operands together with the selected profile's
applicability and behavior. A form can be available in the shared grammar while
being unavailable or restricted in a particular script type. A browser restriction
such as losing an error payload says nothing about the corresponding server
operation unless that server profile states it.

Examples marked as usage illustrate the described operation with any named host
dependencies. Caution examples illustrate restrictions and belong with their
explanation. Sample target names and schemas are illustrative.

## Grammar scope

The grammar describes the statement forms covered by this reference, including
balanced blocks and complete Edit Data bodies. Profile applicability determines
where a parsed form may execute. Groovy imports, members, and interface wrappers
are source-step containers outside this Edit Data body grammar. Their bodies use
Groovy syntax; this reference does not replace the Groovy language grammar.

Grammar recognition of a literal-shaped move destination does not make it a usable
data-area path. Use a quoted path such as `"request/value"` or an appropriate
destination expression such as `evaluate('request/value')`. Outer host wrappers
and structured step configuration remain distinct from the body examples.

## Version identity

Keep four version concepts separate: the script's engine setting, the host
framework release, a script record's revision, and this reference's release.
Groovy also has its own runtime version. An engine number alone does not identify
the complete runtime or its available host APIs.
