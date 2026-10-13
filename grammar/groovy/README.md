# groovy

Groovy engine.

- Engine code: `F1GV`
- Script types: plug-in, groovy-library
- Execution: server
- Expressions: Groovy
- Representations: `groovy-source-contributions`

## Grammar entry point

Use the [Groovy language reference](https://groovy-lang.org/documentation.html) for the language matching the hosting runtime. This profile has no Edit Data grammar and no catch-all substitute for Groovy syntax.

The [Groovy integration chapter](../../specification/groovy-integration.md) describes source-step containers and host requirements.

## Source-step selection

These are source-step choices for each script type. They are distinct from commands inside an Edit Data body and expanded browser instruction types. Selection does not establish engine eligibility or successful application save or execution for every configuration. Numbered service and plug-in Groovy integration requires the host feature. The library selector exposes source contributions separately from engine validation; the groovy profile does not impose an exclusive library engine setting.

| Script type    | Source step              | Stored code |
| -------------- | ------------------------ | ----------- |
| plug-in        | Groovy imports           | `GVIM`      |
| plug-in        | Groovy members           | `GVYM`      |
| groovy-library | Groovy library interface | `GLIF`      |
| groovy-library | Groovy imports           | `GVIM`      |
| groovy-library | Groovy members           | `GVYM`      |

## Profile rules

- Edit Data commands are unavailable in this profile.
- Groovy source must satisfy the host compiler, permitted API rules, and configured extension interface.
- This profile groups Groovy integration. Library engine validation can also accept numbered settings; the grouping and source-step selector do not establish successful save, compilation, or execution.

## Command applicability

| Command                                                      | Applicability | In profile Edit Data grammar |
| ------------------------------------------------------------ | ------------- | ---------------------------- |
| [`move`](../../metadata/commands.json)                       | unavailable   | No                           |
| [`if`](../../metadata/commands.json)                         | unavailable   | No                           |
| [`for`](../../metadata/commands.json)                        | unavailable   | No                           |
| [`goto`](../../metadata/commands.json)                       | unavailable   | No                           |
| [`branch`](../../metadata/commands.json)                     | unavailable   | No                           |
| [`performScript`](../../metadata/commands.json)              | unavailable   | No                           |
| [`transferControl`](../../metadata/commands.json)            | unavailable   | No                           |
| [`navigate`](../../metadata/commands.json)                   | unavailable   | No                           |
| [`navigateAndReloadDashboard`](../../metadata/commands.json) | unavailable   | No                           |
| [`default`](../../metadata/commands.json)                    | unavailable   | No                           |
| [`label`](../../metadata/commands.json)                      | unavailable   | No                           |
| [`edit`](../../metadata/commands.json)                       | unavailable   | No                           |
| [`terminate`](../../metadata/commands.json)                  | unavailable   | No                           |
| [`declareBO`](../../metadata/commands.json)                  | unavailable   | No                           |
| [`declareBOWithBOGroup`](../../metadata/commands.json)       | unavailable   | No                           |
| [`declareBS`](../../metadata/commands.json)                  | unavailable   | No                           |
| [`declareSS`](../../metadata/commands.json)                  | unavailable   | No                           |
| [`declareDA`](../../metadata/commands.json)                  | unavailable   | No                           |
| [`declareMap`](../../metadata/commands.json)                 | unavailable   | No                           |
| [`invokeBO`](../../metadata/commands.json)                   | unavailable   | No                           |
| [`invokeBS`](../../metadata/commands.json)                   | unavailable   | No                           |
| [`invokeSS`](../../metadata/commands.json)                   | unavailable   | No                           |
| [`invokeMap`](../../metadata/commands.json)                  | unavailable   | No                           |
| [`generateBOEditMap`](../../metadata/commands.json)          | unavailable   | No                           |
| [`generateBSEditMap`](../../metadata/commands.json)          | unavailable   | No                           |
| [`generateSSEditMap`](../../metadata/commands.json)          | unavailable   | No                           |
| [`generateDAEditMap`](../../metadata/commands.json)          | unavailable   | No                           |
| [`invokeGroovy`](../../metadata/commands.json)               | unavailable   | No                           |

Detailed operands, behavior, errors, and examples are in the [command reference](../../metadata/commands.json). See the [machine-readable profile contract](../../metadata/profile-contracts.json) and [engine profiles](../../specification/engine-profiles.md).
