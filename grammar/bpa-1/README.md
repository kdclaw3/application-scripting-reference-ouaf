# bpa-1

BPA engine 1.0.

- Engine code: `F110`
- Script types: bpa
- Execution: browser
- Expressions: Browser XPath 1.0
- Representations: `edit-data-body`, `normalized-browser-steps`

## Grammar entry point

[Bpa1.g4](Bpa1.g4) imports the shared [EditData.g4](../EditData.g4) components. Start at `program`; complete input is required. Resolve the imported grammar from the parent grammar directory.

The reference supported-operation subset of Edit Data body syntax. Operand validity, conversion effects, and runtime requirements are additional contract rules.

## Source-step selection

These are source-step choices for each script type. They are distinct from commands inside an Edit Data body and expanded browser instruction types. Selection does not establish engine eligibility or successful application save or execution for every configuration. Numbered service and plug-in Groovy integration requires the host feature. The library selector exposes source contributions separately from engine validation; the groovy profile does not impose an exclusive library engine setting.

| Script type | Source step             | Stored code |
| ----------- | ----------------------- | ----------- |
| bpa         | Display text            | `DISP`      |
| bpa         | Edit Data               | `EDDT`      |
| bpa         | Set focus to a field    | `FCS`       |
| bpa         | Invoke function         | `FUNC`      |
| bpa         | Go to a step            | `GOTO`      |
| bpa         | Height                  | `HGHT`      |
| bpa         | Conditional branch      | `IF`        |
| bpa         | Invoke business object  | `INBO`      |
| bpa         | Invoke business service | `INBS`      |
| bpa         | Invoke map              | `INMP`      |
| bpa         | Input data              | `INP`       |
| bpa         | Invoke service script   | `INSC`      |
| bpa         | Label                   | `LABL`      |
| bpa         | Mathematical operation  | `MATH`      |
| bpa         | Move data               | `MOVE`      |
| bpa         | Navigate to a page      | `NAV`       |
| bpa         | Press a button          | `PRES`      |
| bpa         | Prompt user             | `PRMT`      |
| bpa         | Perform script          | `PSCR`      |
| bpa         | Terminate               | `TERM`      |
| bpa         | Transfer control        | `XCTL`      |

## Profile rules

- The grammar consumes the complete Edit Data body; unconsumed trailing text is invalid.
- Quoted expressions are tokens in this grammar. Their XPath syntax and meaning belong to the selected expression environment.
- Grammar acceptance does not establish valid data paths, available targets, permitted operands, or successful execution.
- An excluded operation may still parse or become a no-op. Exclusion describes the reference supported-operation subset, not parser or application-save rejection.
- Use command applicability and constraints together with the grammar. A no-step form is retained to describe accepted syntax that emits no browser operation.
- An unsafe form remains syntactically available but is limited to caution examples. In browser profiles, branch loses its condition during conversion; use if with goto.
- Groovy source steps and invokeGroovy are unavailable in browser execution.

## Command applicability

| Command                                                      | Applicability | In profile Edit Data grammar |
| ------------------------------------------------------------ | ------------- | ---------------------------- |
| [`move`](../../metadata/commands.json)                       | limited       | Yes                          |
| [`if`](../../metadata/commands.json)                         | supported     | Yes                          |
| [`for`](../../metadata/commands.json)                        | limited       | Yes                          |
| [`goto`](../../metadata/commands.json)                       | supported     | Yes                          |
| [`branch`](../../metadata/commands.json)                     | unsafe        | Yes                          |
| [`performScript`](../../metadata/commands.json)              | limited       | Yes                          |
| [`transferControl`](../../metadata/commands.json)            | limited       | Yes                          |
| [`navigate`](../../metadata/commands.json)                   | limited       | Yes                          |
| [`navigateAndReloadDashboard`](../../metadata/commands.json) | limited       | Yes                          |
| [`default`](../../metadata/commands.json)                    | supported     | Yes                          |
| [`label`](../../metadata/commands.json)                      | no-step       | Yes                          |
| [`edit`](../../metadata/commands.json)                       | no-step       | Yes                          |
| [`terminate`](../../metadata/commands.json)                  | limited       | Yes                          |
| [`declareBO`](../../metadata/commands.json)                  | supported     | Yes                          |
| [`declareBOWithBOGroup`](../../metadata/commands.json)       | supported     | Yes                          |
| [`declareBS`](../../metadata/commands.json)                  | supported     | Yes                          |
| [`declareSS`](../../metadata/commands.json)                  | supported     | Yes                          |
| [`declareDA`](../../metadata/commands.json)                  | supported     | Yes                          |
| [`declareMap`](../../metadata/commands.json)                 | supported     | Yes                          |
| [`invokeBO`](../../metadata/commands.json)                   | limited       | Yes                          |
| [`invokeBS`](../../metadata/commands.json)                   | limited       | Yes                          |
| [`invokeSS`](../../metadata/commands.json)                   | limited       | Yes                          |
| [`invokeMap`](../../metadata/commands.json)                  | limited       | Yes                          |
| [`generateBOEditMap`](../../metadata/commands.json)          | limited       | Yes                          |
| [`generateBSEditMap`](../../metadata/commands.json)          | limited       | Yes                          |
| [`generateSSEditMap`](../../metadata/commands.json)          | limited       | Yes                          |
| [`generateDAEditMap`](../../metadata/commands.json)          | limited       | Yes                          |
| [`invokeGroovy`](../../metadata/commands.json)               | unavailable   | No                           |

Detailed operands, behavior, errors, and examples are in the [command reference](../../metadata/commands.json). See the [machine-readable profile contract](../../metadata/profile-contracts.json) and [engine profiles](../../specification/engine-profiles.md).
