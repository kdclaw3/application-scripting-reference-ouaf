# server-2

Server engine 2.0.

- Engine code: `F120`
- Script types: service, plug-in
- Execution: server
- Expressions: XPath 2.0
- Representations: `edit-data-body`, `groovy-source-contributions`

## Grammar entry point

[Server2.g4](Server2.g4) imports the shared [EditData.g4](../EditData.g4) components. Start at `program`; complete input is required. Resolve the imported grammar from the parent grammar directory.

The reference supported-operation subset of Edit Data body syntax. Operand validity, conversion effects, and runtime requirements are additional contract rules.

## Source-step selection

These are source-step choices for each script type. They are distinct from commands inside an Edit Data body and expanded browser instruction types. Selection does not establish engine eligibility or successful application save or execution for every configuration. Numbered service and plug-in Groovy integration requires the host feature. The library selector exposes source contributions separately from engine validation; the groovy profile does not impose an exclusive library engine setting.

| Script type | Source step             | Stored code |
| ----------- | ----------------------- | ----------- |
| service     | Edit Data               | `EDDT`      |
| service     | Go to a step            | `GOTO`      |
| service     | Groovy imports          | `GVIM`      |
| service     | Groovy members          | `GVYM`      |
| service     | Conditional branch      | `IF`        |
| service     | Invoke business object  | `INBO`      |
| service     | Invoke business service | `INBS`      |
| service     | Invoke service script   | `INSC`      |
| service     | Label                   | `LABL`      |
| service     | Move data               | `MOVE`      |
| service     | Terminate               | `TERM`      |
| plug-in     | Edit Data               | `EDDT`      |
| plug-in     | Go to a step            | `GOTO`      |
| plug-in     | Groovy imports          | `GVIM`      |
| plug-in     | Groovy members          | `GVYM`      |
| plug-in     | Conditional branch      | `IF`        |
| plug-in     | Invoke business object  | `INBO`      |
| plug-in     | Invoke business service | `INBS`      |
| plug-in     | Invoke service script   | `INSC`      |
| plug-in     | Label                   | `LABL`      |
| plug-in     | Move data               | `MOVE`      |
| plug-in     | Terminate               | `TERM`      |

## Profile rules

- The grammar consumes the complete Edit Data body; unconsumed trailing text is invalid.
- Quoted expressions are tokens in this grammar. Their XPath syntax and meaning belong to the selected expression environment.
- Grammar acceptance does not establish valid data paths, available targets, permitted operands, or successful execution.
- An excluded operation may still parse or become a no-op. Exclusion describes the reference supported-operation subset, not parser or application-save rejection.
- Use command applicability and constraints together with the grammar. A no-step form is retained to describe accepted syntax that emits no browser operation.
- An unsafe form remains syntactically available but is limited to caution examples. In browser profiles, branch loses its condition during conversion; use if with goto.
- Groovy members are a separate source contribution and can be called with invokeGroovy when the host enables them.
- Browser interaction commands are unavailable in server execution.

## Command applicability

| Command                                                      | Applicability | In profile Edit Data grammar |
| ------------------------------------------------------------ | ------------- | ---------------------------- |
| [`move`](../../metadata/commands.json)                       | supported     | Yes                          |
| [`if`](../../metadata/commands.json)                         | supported     | Yes                          |
| [`for`](../../metadata/commands.json)                        | supported     | Yes                          |
| [`goto`](../../metadata/commands.json)                       | supported     | Yes                          |
| [`branch`](../../metadata/commands.json)                     | supported     | Yes                          |
| [`performScript`](../../metadata/commands.json)              | unavailable   | No                           |
| [`transferControl`](../../metadata/commands.json)            | unavailable   | No                           |
| [`navigate`](../../metadata/commands.json)                   | unavailable   | No                           |
| [`navigateAndReloadDashboard`](../../metadata/commands.json) | unavailable   | No                           |
| [`default`](../../metadata/commands.json)                    | supported     | Yes                          |
| [`label`](../../metadata/commands.json)                      | supported     | Yes                          |
| [`edit`](../../metadata/commands.json)                       | supported     | Yes                          |
| [`terminate`](../../metadata/commands.json)                  | supported     | Yes                          |
| [`declareBO`](../../metadata/commands.json)                  | supported     | Yes                          |
| [`declareBOWithBOGroup`](../../metadata/commands.json)       | supported     | Yes                          |
| [`declareBS`](../../metadata/commands.json)                  | supported     | Yes                          |
| [`declareSS`](../../metadata/commands.json)                  | supported     | Yes                          |
| [`declareDA`](../../metadata/commands.json)                  | supported     | Yes                          |
| [`declareMap`](../../metadata/commands.json)                 | supported     | Yes                          |
| [`invokeBO`](../../metadata/commands.json)                   | supported     | Yes                          |
| [`invokeBS`](../../metadata/commands.json)                   | supported     | Yes                          |
| [`invokeSS`](../../metadata/commands.json)                   | supported     | Yes                          |
| [`invokeMap`](../../metadata/commands.json)                  | unavailable   | No                           |
| [`generateBOEditMap`](../../metadata/commands.json)          | unavailable   | No                           |
| [`generateBSEditMap`](../../metadata/commands.json)          | unavailable   | No                           |
| [`generateSSEditMap`](../../metadata/commands.json)          | unavailable   | No                           |
| [`generateDAEditMap`](../../metadata/commands.json)          | unavailable   | No                           |
| [`invokeGroovy`](../../metadata/commands.json)               | limited       | Yes                          |

Detailed operands, behavior, errors, and examples are in the [command reference](../../metadata/commands.json). See the [machine-readable profile contract](../../metadata/profile-contracts.json) and [engine profiles](../../specification/engine-profiles.md).
