// Maintainer-only checks for this repository's authored reference materials.
// Generated grammars stay in ignored output; no parser API is exported.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdir, mkdtemp, readFile, readdir, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { Ajv } from "ajv";
import {
  BaseErrorListener,
  CharStream,
  CommonTokenStream,
  Token,
} from "antlr4ng";
import { marked } from "marked";
// The pinned package's barrel exports a type as a value, and its CLI can exit
// successfully after grammar errors. Use its Tool and inspect diagnostics.
import { Tool } from "../node_modules/antlr-ng/dist/src/Tool.js";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const json = async (path) =>
  JSON.parse(await readFile(join(root, path), "utf8"));
const text = async (path) => readFile(join(root, path), "utf8");
const commands = await json("metadata/commands.json");
const contracts = await json("metadata/profile-contracts.json");
const mapping = await json("tools/reference-examples.json");
const profiles = contracts.profiles.filter(
  (profile) => profile.grammar.kind === "edit-data",
);
assert.equal(
  profiles.length,
  5,
  "Expected all five Edit Data profile grammars.",
);
assert.equal(mapping.schemaVersion, 1, "Unsupported example mapping version.");
await mkdir(join(root, "generated"), { recursive: true });
const output = await mkdtemp(join(root, "generated", "reference-check-"));
const parsers = new Map();
const totals = {
  grammars: 0,
  textExamples: 0,
  mappedProfileParses: 0,
  markdownEditDataExamples: 0,
  externalLanguageBlocks: 0,
  structuredExamples: 0,
  structuredTargetChecks: 0,
  structuredChoiceChecks: 0,
  embeddedEditDataExamples: 0,
  commandFormChecks: 0,
  malformedChecks: 0,
};

function execute(script, args) {
  const result = spawnSync(process.execPath, [script, ...args], {
    cwd: root,
    encoding: "utf8",
    timeout: 120000,
    maxBuffer: 16 * 1024 * 1024,
  });
  if (result.error) throw result.error;
  assert.equal(result.status, 0, result.stdout + result.stderr);
}

for (const grammar of [
  { id: "shared", name: "EditData", path: "grammar/EditData.g4" },
  ...profiles.map((profile) => ({ id: profile.id, ...profile.grammar })),
]) {
  const directory = join(output, grammar.id);
  await mkdir(directory);
  const generator = new Tool([
    "-Dlanguage=TypeScript",
    "--warnings-are-errors",
    "true",
    "--exact-output-dir",
    "true",
    "--lib",
    join(root, "grammar"),
    "-o",
    directory,
    join(root, grammar.path),
  ]);
  generator.processGrammarsOnCommandLine();
  assert.equal(
    generator.getNumErrors(),
    0,
    `${grammar.id}: grammar generation failed`,
  );
  const sources = (await readdir(directory))
    .filter((name) => name.endsWith(".ts"))
    .map((name) => join(directory, name));
  assert(sources.length >= 2, `${grammar.id}: missing generated source files`);
  execute(join(root, "node_modules/typescript/bin/tsc"), [
    "--target",
    "ES2022",
    "--module",
    "NodeNext",
    "--moduleResolution",
    "NodeNext",
    "--strict",
    "--noEmitOnError",
    ...sources,
  ]);
  const Lexer = (
    await import(pathToFileURL(join(directory, `${grammar.name}Lexer.js`)))
  )[`${grammar.name}Lexer`];
  const Parser = (
    await import(pathToFileURL(join(directory, `${grammar.name}Parser.js`)))
  )[`${grammar.name}Parser`];
  parsers.set(grammar.id, (source) => {
    const errors = [];
    class Errors extends BaseErrorListener {
      syntaxError(_recognizer, _token, line, column, message) {
        errors.push(`${line}:${column} ${message}`);
      }
    }
    const lexer = new Lexer(CharStream.fromString(source));
    lexer.removeErrorListeners();
    lexer.addErrorListener(new Errors());
    const tokens = new CommonTokenStream(lexer);
    // Read the entire source even if a future entry rule stops early.
    tokens.fill();
    const parser = new Parser(tokens);
    parser.removeErrorListeners();
    parser.addErrorListener(new Errors());
    parser.program();
    if (tokens.LA(1) !== Token.EOF) errors.push("Unconsumed input remains.");
    return errors;
  });
  totals.grammars++;
}

async function files(directory, extension) {
  const found = [];
  for (const entry of await readdir(join(root, directory), {
    withFileTypes: true,
  })) {
    const path = `${directory}/${entry.name}`;
    if (entry.isDirectory()) found.push(...(await files(path, extension)));
    else if (entry.isFile() && entry.name.endsWith(extension)) found.push(path);
  }
  return found.sort();
}

function uniqueRows(rows, key, label) {
  assert(Array.isArray(rows), `${label}: expected a list`);
  const result = new Map(rows.map((row) => [row[key], row]));
  assert.equal(result.size, rows.length, `${label}: duplicate mapping`);
  return result;
}

function checkProfiles(source, selected, label) {
  assert(
    Array.isArray(selected) && selected.length > 0,
    `${label}: missing profiles`,
  );
  assert.equal(
    new Set(selected).size,
    selected.length,
    `${label}: duplicate profiles`,
  );
  assert(
    !selected.includes("shared"),
    `${label}: map an execution profile explicitly`,
  );
  for (const id of ["shared", ...selected]) {
    const parse = parsers.get(id);
    assert(parse, `${label}: unknown Edit Data profile ${id}`);
    assert.deepEqual(parse(source), [], `${label}: ${id} syntax`);
    totals.mappedProfileParses++;
  }
}

const textMapping = uniqueRows(mapping.text, "path", "Text examples");
assert.deepEqual(
  [...textMapping.keys()].sort(),
  await files("examples", ".bpa"),
  "Every text example must have an explicit profile mapping; remove stale mappings.",
);
for (const [path, entry] of textMapping) {
  checkProfiles(await text(path), entry.profiles, path);
  totals.textExamples++;
}
for (const command of commands) {
  for (const entry of [
    { example: command.example, profiles: command.exampleProfiles },
    ...command.variants.filter((variant) => variant.example),
  ]) {
    const selected = textMapping.get(entry.example)?.profiles;
    assert(selected, `${entry.example}: command example is unmapped`);
    for (const id of entry.profiles)
      assert(
        selected.includes(id),
        `${entry.example}: missing documented profile ${id}`,
      );
  }
}

// Classify every published fence, including non-Edit-Data language boundaries.
const markdownMapping = uniqueRows(
  mapping.markdown,
  "path",
  "Markdown examples",
);
const markdownFiles = [
  "README.md",
  ...(await files("specification", ".md")),
  ...(await files("grammar", ".md")),
].sort();
const mappedMarkdown = [];
for (const path of markdownFiles) {
  const blocks = [];
  marked.walkTokens(marked.lexer(await text(path)), (token) => {
    if (token.type === "code") blocks.push(token);
  });
  if (!blocks.length) continue;
  mappedMarkdown.push(path);
  const entry = markdownMapping.get(path);
  assert(entry, `${path}: unmapped published code fences`);
  const byIndex = uniqueRows(entry.blocks, "index", path);
  assert.deepEqual(
    [...byIndex.keys()].sort((a, b) => a - b),
    blocks.map((_, i) => i),
    `${path}: unmapped or stale code fence`,
  );
  for (const [index, block] of blocks.entries()) {
    const selection = byIndex.get(index);
    assert.equal(
      selection.language,
      block.lang ?? "",
      `${path}#${index}: fence language changed`,
    );
    if (selection.kind === "edit-data") {
      checkProfiles(block.text, selection.profiles, `${path}#${index}`);
      totals.markdownEditDataExamples++;
    } else {
      assert(
        ["groovy-source", "shell"].includes(selection.kind),
        `${path}#${index}: unknown boundary`,
      );
      assert(
        typeof selection.reason === "string" && selection.reason.length > 0,
        `${path}#${index}: missing boundary reason`,
      );
      totals.externalLanguageBlocks++;
    }
  }
}
assert.deepEqual(
  [...markdownMapping.keys()].sort(),
  mappedMarkdown,
  "Remove stale Markdown mappings.",
);

const ajv = new Ajv({ allErrors: true });
const validSteps = ajv.compile(await json("schemas/steps.schema.json"));
for (const path of await files("examples", ".json")) {
  const data = await json(path);
  assert(validSteps(data), `${path}: ${ajv.errorsText(validSteps.errors)}`);
  const sequences = new Set(data.steps.map((step) => step.sequence));
  assert.equal(
    sequences.size,
    data.steps.length,
    `${path}: duplicate structured sequence`,
  );
  for (const step of data.steps) {
    const label = `${path}: step ${step.sequence}`;
    // Numeric targets refer to local sequences; named targets belong to the host.
    for (const [field, target] of Object.entries(step.fields)) {
      if (
        (field === "target" || field.endsWith("Target")) &&
        typeof target === "number"
      ) {
        assert(
          sequences.has(target),
          `${label} ${field}: unknown sequence ${target}`,
        );
        totals.structuredTargetChecks++;
      }
    }
    const choices = step.fields.choices ?? [];
    assert(
      choices.filter((choice) => choice.default === true).length <= 1,
      `${label}: multiple default choices`,
    );
    for (const [index, choice] of choices.entries()) {
      assert(
        sequences.has(choice.target),
        `${label} choice ${index}: unknown sequence ${choice.target}`,
      );
      totals.structuredChoiceChecks++;
    }
    if (step.kind !== "edit-data") continue;
    checkProfiles(
      step.fields.script,
      [data.profile],
      `${path}: step ${step.sequence}`,
    );
    totals.embeddedEditDataExamples++;
  }
  totals.structuredExamples++;
}

// Exercise the excluded forms too: a permissive profile grammar is a failure.
for (const profile of profiles) {
  const forms = new Map(
    profile.commandForms.map((form) => [form.command, form]),
  );
  for (const command of commands) {
    const form = forms.get(command.id);
    assert(form, `${profile.id}/${command.id}: missing command contract`);
    const source = await text(command.example);
    for (const [context, candidate] of [
      ["top-level", source],
      ["conditional", `if ("true()")\n${source}\nend-if;`],
      ["loop", `for ($item in "items/item")\n${source}\nend-for;`],
      ["edit-block", `edit data\n${source}\nend-edit;`],
    ]) {
      const errors = parsers.get(profile.id)(candidate);
      assert.equal(
        errors.length === 0,
        form.includedInGrammar,
        `${profile.id}/${command.id}/${context}: ${errors.join("; ")}`,
      );
      totals.commandFormChecks++;
    }
  }
}
for (const [id, parse] of parsers) {
  for (const source of [
    "move;",
    "if (\"true()\") move 'x' to $x;",
    "terminate; trailingGarbage",
    "terminate; @",
  ]) {
    assert(parse(source).length > 0, `${id}: accepted invalid input ${source}`);
    totals.malformedChecks++;
  }
}

const report = {
  passed: true,
  ...totals,
  scope:
    "Complete-body grammar compilation and syntax checks for mapped text and structured examples.",
};
await writeFile(
  join(output, "report.json"),
  JSON.stringify(report, null, 2) + "\n",
);
console.log(
  JSON.stringify(
    { ...report, output: relative(root, output).replaceAll("\\", "/") },
    null,
    2,
  ),
);
