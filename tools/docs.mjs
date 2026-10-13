import {
  lstat,
  mkdir,
  readFile,
  readdir,
  realpath,
  rm,
  writeFile,
} from "node:fs/promises";
import { dirname, isAbsolute, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { marked } from "marked";
import { Ajv } from "ajv";

const root = await realpath(fileURLToPath(new URL("..", import.meta.url)));
const outputRoot = resolve(root, "site");
const inside = (parent, path) => {
  const suffix = relative(parent, path);
  return (
    suffix !== "" && !isAbsolute(suffix) && !/^\.\.(?:[\\/]|$)/.test(suffix)
  );
};
const read = async (path) => {
  const fullPath = await realpath(resolve(root, path));
  if (!inside(root, fullPath))
    throw new Error(`Source outside project: ${path}`);
  return readFile(fullPath, "utf8");
};
const json = async (path) => JSON.parse(await read(path));
const commands = await json("metadata/commands.json");
const steps = await json("metadata/steps.json");
const profiles = await json("metadata/profiles.json");
const profileContracts = await json("metadata/profile-contracts.json");
const version = (await json("package.json")).version;
const title = "Application Scripting Reference for OUAF";
const subtitle = "An independent, unofficial reference.";
const purpose =
  "This project is an informational reference. Its grammars, examples, and metadata document scripting syntax and behavior. It is not offered or maintained as a software library, parser, or runtime implementation. The materials are provided under the MIT License, without warranty.";
const schemas = new Map();
for (const name of [
  "commands.schema.json",
  "step-reference.schema.json",
  "steps.schema.json",
  "profiles.schema.json",
  "profile-contracts.schema.json",
])
  schemas.set(name, await json(`schemas/${name}`));
const ajv = new Ajv({ allErrors: true });
for (const [name, data] of [
  ["commands.schema.json", commands],
  ["step-reference.schema.json", steps],
  ["profiles.schema.json", profiles],
  ["profile-contracts.schema.json", profileContracts],
]) {
  const matches = ajv.compile(schemas.get(name));
  if (!matches(data))
    throw new Error(
      `Reference metadata does not match ${name}: ${JSON.stringify(matches.errors)}`,
    );
}
const profileById = new Map(profiles.map((profile) => [profile.id, profile]));
if (profileById.size !== profiles.length)
  throw new Error("Duplicate execution profile identifiers.");
const contractById = new Map(
  profileContracts.profiles.map((contract) => [contract.id, contract]),
);
if (
  contractById.size !== profiles.length ||
  contractById.size !== profileContracts.profiles.length
)
  throw new Error("Profile contracts must cover each profile exactly once.");
for (const profile of profiles) {
  const contract = contractById.get(profile.id);
  if (
    !contract ||
    contract.engineCode !== profile.engineCode ||
    contract.execution !== profile.execution ||
    contract.expressionLanguage !== profile.expressionLanguage ||
    JSON.stringify(contract.scriptTypes) !== JSON.stringify(profile.scriptTypes)
  )
    throw new Error(`Profile contract identity differs: ${profile.id}`);
  if (
    JSON.stringify(Object.keys(contract.sourceStepsByScriptType).sort()) !==
    JSON.stringify([...profile.scriptTypes].sort())
  )
    throw new Error(`Source-step selection differs: ${profile.id}`);
  for (const steps of Object.values(contract.sourceStepsByScriptType))
    if (new Set(steps.map((step) => step.code)).size !== steps.length)
      throw new Error(`Duplicate source-step code: ${profile.id}`);
  const forms = new Map(
    contract.commandForms.map((form) => [form.command, form]),
  );
  if (
    forms.size !== commands.length ||
    forms.size !== contract.commandForms.length
  )
    throw new Error(`Incomplete profile command contract: ${profile.id}`);
  if (
    (profile.id === "groovy") !==
    (contract.grammar.kind === "external-groovy")
  )
    throw new Error(`Wrong grammar kind: ${profile.id}`);
  for (const command of commands) {
    const form = forms.get(command.id);
    const status = command.variants.find((variant) =>
      variant.profiles.includes(profile.id),
    )?.status;
    if (
      !form ||
      form.syntaxRule !== command.grammarRule ||
      form.applicability !== status ||
      form.includedInGrammar !==
        (profile.id !== "groovy" && status !== "unavailable")
    )
      throw new Error(
        `Profile command contract differs: ${profile.id}/${command.id}`,
      );
  }
}
for (const command of commands) {
  const covered = command.variants.flatMap((variant) => variant.profiles);
  if (
    covered.length !== profiles.length ||
    new Set(covered).size !== profiles.length ||
    covered.some((id) => !profileById.has(id))
  )
    throw new Error(
      `${command.id} must describe every execution profile exactly once.`,
    );
  if (
    command.exampleRole === "usage" &&
    command.exampleProfiles.some((id) =>
      command.variants.some(
        (variant) =>
          variant.profiles.includes(id) &&
          ["unavailable", "no-step", "unsafe"].includes(variant.status),
      ),
    )
  )
    throw new Error(
      `${command.id} usage example names an unavailable, non-emitting, or unsafe profile.`,
    );
}
const grammar = await read("grammar/EditData.g4");
const profileGrammarFiles = new Map();
for (const contract of profileContracts.profiles) {
  if (contract.grammar.kind !== "edit-data") continue;
  if (!contract.grammar.path.startsWith(`grammar/${contract.id}/`))
    throw new Error(`Grammar belongs to another profile: ${contract.id}`);
  profileGrammarFiles.set(
    contract.grammar.path,
    await read(contract.grammar.path),
  );
}
const chapters = [
  "introduction",
  "engine-profiles",
  "lexical-structure",
  "data-model",
  "execution-model",
  "structured-steps",
  "groovy-integration",
  "limitations",
];
const ids = new Set([...commands, ...steps].map((concept) => concept.id));
if (ids.size !== commands.length + steps.length)
  throw new Error("Duplicate concept identifiers.");
for (const command of commands)
  for (const id of command.related)
    if (
      !ids.has(id) &&
      !["bpa.model.control-flow", "bpa.model.data"].includes(id)
    )
      throw new Error(`Unresolved concept ${id}`);

const escape = (text) =>
  text.replace(
    /[&<>"']/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        character
      ],
  );
const links = [
  ["index", "Overview"],
  ...chapters.map((name) => [name, name.replaceAll("-", " ")]),
  ["grammar", "Formal grammar"],
  ["examples", "Examples"],
];
const nav = links
  .map(([href, title]) => `<a href="${href}.html">${escape(title)}</a>`)
  .join("");
const output = new Map();
const emit = (name, content) => {
  if (!inside(outputRoot, resolve(outputRoot, name)))
    throw new Error(`Output outside site: ${name}`);
  if (output.has(name) && output.get(name) !== content)
    throw new Error(`Conflicting output: ${name}`);
  output.set(name, content);
};
const style = `:root{color-scheme:light dark;--bg:#f5f7fa;--panel:#fff;--ink:#162431;--muted:#435768;--border:#ced8df;--link:#13598b}*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:17px/1.65 system-ui,sans-serif}header{border-bottom:1px solid var(--border);padding:20px max(20px,calc((100% - 1100px)/2));background:var(--panel)}header strong{font-size:23px}nav{display:flex;gap:8px 20px;flex-wrap:wrap;margin-top:12px}a{color:var(--link);text-underline-offset:3px}main{max-width:1100px;margin:32px auto;padding:32px;background:var(--panel);border:1px solid var(--border);border-radius:12px}h1{line-height:1.2;font-size:36px}h2{margin-top:32px}pre{background:var(--bg);padding:20px;border:1px solid var(--border);border-radius:8px;overflow:auto;font-size:14px;line-height:1.6}code{font-size:.9em}table{border-collapse:collapse;width:100%;display:block;overflow:auto}td,th{text-align:left;vertical-align:top;border-bottom:1px solid var(--border);padding:12px}th{background:var(--bg)}a:focus-visible,button:focus-visible{outline:3px solid #e88b25;outline-offset:4px}footer{max-width:1100px;margin:24px auto;padding:0 20px;color:var(--muted)}.skip{position:absolute;left:-9999px}.skip:focus{left:10px;top:10px;background:var(--panel);padding:10px}@media(max-width:600px){main{margin:16px 10px;padding:20px}h1{font-size:29px}nav{font-size:14px}header{padding:18px}}@media(prefers-color-scheme:dark){:root{--bg:#111a24;--panel:#192532;--ink:#e5edf4;--muted:#b7c8d7;--border:#3c4d5e;--link:#87caff}}`;
emit("style.css", style);
function page(name, markdown) {
  if (!/^[a-zA-Z0-9-]+$/.test(name))
    throw new Error(`Invalid page name: ${name}`);
  const body = marked.parse(
    markdown
      .replace(/\]\(\.\.\/grammar\/README\.md\)/g, "](grammar.html)")
      .replace(/\]\(([a-z-]+)\.md(#[^)]*)?\)/g, "]($1.html$2)"),
  );
  emit(
    `${name}.html`,
    `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(name)} · ${escape(title)}</title><link rel="stylesheet" href="style.css"></head><body><a class="skip" href="#content">Skip to content</a><header><strong>${escape(title)}</strong><div><em>${escape(subtitle)}</em></div><div>Language specification · ${escape(version)}</div><nav aria-label="Reference">${nav}</nav></header><main id="content">${body}</main><footer>Application scripting reference. <a href="engine-profiles.html">Execution profiles</a> · <a href="limitations.html">Scope and runtime boundaries</a> · <a href="license.html">MIT License</a>.</footer></body></html>`,
  );
}
const license = await read("LICENSE");
emit("LICENSE", license);
page(
  "license",
  `# MIT License\n\n${purpose}\n\n[Download license](LICENSE)\n\n${license}`,
);
for (const chapter of chapters)
  page(chapter, await read(`specification/${chapter}.md`));
page(
  "grammar",
  `# Profile grammars\n\nChoose the profile ID before choosing a grammar. Each profile combines its syntax entry point with command applicability, operand restrictions, and execution rules.\n\n| Profile ID | Grammar entry point |\n| --- | --- |\n${profileContracts.profiles.map((contract) => `| [\`${contract.id}\`](profile-${contract.id}.html) | ${contract.grammar.kind === "edit-data" ? `[${contract.grammar.name}.g4](${contract.grammar.path}), \`${contract.grammar.entryPoint}\`` : `[Groovy language](${contract.grammar.languageReference}) and [host integration](groovy-integration.html)`} |`).join("\n")}\n\nThe Edit Data grammars import [shared EditData.g4](grammar/EditData.g4) and replace the statement selection. Resolve that import from the common grammar directory. They require complete input. The three server grammars select the same syntax; expression evaluation and runtime behavior remain profile-specific.\n\nA \`no-step\` form remains present when it is accepted but emits no browser operation. A \`limited\` form has additional operand or behavior restrictions. An \`unsafe\` form stays in the grammar to describe accepted syntax with unreliable execution semantics and is restricted to caution examples. Browser textual \`branch\` discards its condition; use \`if\` with \`goto\`. Server \`branch\` remains supported. Profile selection describes this reference's supported-operation subset. An excluded operation can still parse or become a no-op; exclusion does not establish parser or application-save rejection.\n\nThe legacy profile's Edit Data grammar does not define native legacy records or a modern-text-to-legacy round trip. [Normalized browser JSON](steps.schema.json) describes \`bpa-1\` examples. Quoted XPath and Groovy source have separate language boundaries.\n\n[Machine-readable profile contracts](profile-contracts.json) · [Contract schema](profile-contracts.schema.json)\n\n## Shared Edit Data components\n\n[Download shared grammar](EditData.g4)\n\n\`\`\`antlr\n${grammar}\n\`\`\``,
);
emit("EditData.g4", grammar);
emit("grammar/EditData.g4", grammar);
for (const [path, text] of profileGrammarFiles) emit(path, text);
emit(
  "profile-contracts.json",
  JSON.stringify(profileContracts, null, 2) + "\n",
);
for (const [name, schema] of schemas)
  emit(name, JSON.stringify(schema, null, 2) + "\n");

const catalog = {
  version,
  profiles: profiles.map((profile) => profile.id),
  profileContracts: profileContracts.profiles,
  concepts: [
    { id: "bpa.model.control-flow", kind: "model", name: "Control flow" },
    { id: "bpa.model.data", kind: "model", name: "Data model" },
    ...profiles.map((profile) => ({
      ...profile,
      id: `bpa.profile.${profile.id}`,
      profile: profile.id,
      kind: "profile",
    })),
  ],
  relationships: [],
};
const examples = { usage: [], caution: [], variants: [], steps: [] };
const list = (items) => items.map((item) => `- ${item}`).join("\n") || "None.";
const profileNames = (ids) =>
  ids.map((id) => profileById.get(id).name).join(", ");
const tableCell = (value) =>
  String(value).replaceAll("|", "\\|").replaceAll("\n", " ");
const profileTable = `| Profile ID | Profile | Engine code | Script types | Execution | Expressions |\n| --- | --- | --- | --- | --- | --- |\n${profiles.map((profile) => `| \`${profile.id}\` | [${tableCell(profile.name)}](profile-${profile.id}.html) | ${profile.engineCode} | ${profile.scriptTypes.join(", ")} | ${profile.execution} | ${tableCell(profile.expressionLanguage)} |`).join("\n")}`;
for (const profile of profiles) {
  const contract = contractById.get(profile.id);
  const selectedGrammar = contract.grammar;
  const sourceStepTable = `| Script type | Source step | Stored code |\n| --- | --- | --- |\n${Object.entries(
    contract.sourceStepsByScriptType,
  )
    .flatMap(([scriptType, steps]) =>
      steps.map(
        (step) =>
          `| ${scriptType} | ${tableCell(step.name)} | \`${step.code}\` |`,
      ),
    )
    .join("\n")}`;
  const grammarDescription =
    selectedGrammar.kind === "edit-data"
      ? `[${selectedGrammar.name}.g4](${selectedGrammar.path}) imports [EditData.g4](${selectedGrammar.sharedGrammar}); start at \`${selectedGrammar.entryPoint}\` and consume the complete body.\n\n${selectedGrammar.syntaxScope}\n\n\`\`\`antlr\n${profileGrammarFiles.get(selectedGrammar.path)}\n\`\`\``
      : `Use the host-compatible [Groovy language reference](${selectedGrammar.languageReference}) and [Groovy integration contract](groovy-integration.html).\n\n${selectedGrammar.syntaxScope}`;
  const applicable = commands.map((command) => ({
    command,
    variant: command.variants.find((variant) =>
      variant.profiles.includes(profile.id),
    ),
  }));
  page(
    `profile-${profile.id}`,
    `# ${profile.name}\n\n${profile.description}\n\n- Profile identifier: \`${profile.id}\`\n- Engine code: \`${profile.engineCode}\`\n- Script types: ${profile.scriptTypes.join(", ")}\n- Execution: ${profile.execution}\n- Expression language: ${profile.expressionLanguage}\n- Representations: ${contract.representations.map((form) => `\`${form}\``).join(", ")}\n\nSee [engine profiles](engine-profiles.html) for eligibility and compatibility distinctions.\n\n## Grammar entry point\n\n${grammarDescription}\n\n## Source-step selection\n\nThese are source-step choices, distinct from Edit Data commands and expanded browser instructions. Selection does not establish engine eligibility, successful application save, or execution for every configuration. Numbered service and plug-in Groovy integration requires the host feature. The library selector exposes source contributions separately from engine validation; the groovy profile does not impose an exclusive library engine setting.\n\n${sourceStepTable}\n\n## Profile rules\n\n${list(contract.restrictions)}\n\n## Command applicability\n\n| Command | Applicability | Included in profile Edit Data grammar |\n| --- | --- | --- |\n${applicable.map(({ command, variant }) => `| [${command.name}](command-${command.name}.html) | **${variant.status}** | ${contract.commandForms.find((form) => form.command === command.id).includedInGrammar ? "Yes" : "No"} |`).join("\n")}\n\n[Machine-readable profile contracts](profile-contracts.json).`,
  );
  catalog.concepts.push({
    kind: "profile-contract",
    ...contract,
    id: `bpa.contract.${profile.id}`,
    profile: profile.id,
  });
  catalog.relationships.push({
    from: `bpa.profile.${profile.id}`,
    type: "definedBy",
    to: `bpa.contract.${profile.id}`,
  });
  for (const form of contract.commandForms)
    catalog.relationships.push({
      from: `bpa.contract.${profile.id}`,
      type: "describesCommand",
      to: form.command,
    });
}
for (const command of commands) {
  const sample = await read(command.example);
  const rule = grammar.match(
    new RegExp(`^${command.grammarRule}\\s*:[\\s\\S]*?;(?=\\r?\\n)`, "m"),
  )?.[0];
  if (!rule) throw new Error(`Missing grammar rule ${command.grammarRule}`);
  const exampleVariants = command.variants.filter((variant) =>
    variant.profiles.some((id) => command.exampleProfiles.includes(id)),
  );
  const matrix = `| Execution profile | Applicability |\n| --- | --- |\n${profiles.map((profile) => `| [${tableCell(profile.name)}](profile-${profile.id}.html) | ${command.variants.find((variant) => variant.profiles.includes(profile.id)).status} |`).join("\n")}`;
  const variantSections = [];
  for (const variant of command.variants) {
    let variantExample = "";
    if (variant.example) {
      const text = await read(variant.example);
      emit(variant.example, text);
      variantExample = `\n\n### Example: ${profileNames(variant.profiles)}\n\n\`\`\`bpa\n${text}\n\`\`\`\n\n[Download example](${variant.example}).`;
      examples.variants.push(
        `### [${command.name}](command-${command.name}.html): ${profileNames(variant.profiles)}\n\n${variant.behavior}${variantExample}`,
      );
    }
    variantSections.push(
      `## ${profileNames(variant.profiles)}\n\n**Applicability: ${variant.status}.**\n\n${variant.behavior}\n\n### Constraints\n\n${list(variant.constraints)}${variant.errors.length ? `\n\n### Errors and context\n\n${list(variant.errors)}` : ""}${variantExample}`,
    );
  }
  page(
    `command-${command.name}`,
    `# ${command.name}\n\n${command.purpose}\n\n## Applicability\n\n${matrix}\n\nSee [engine profiles](engine-profiles.html) for the distinction between script types and engine selections.\n\n## Syntax\n\n\`\`\`antlr\n${rule}\n\`\`\`\n\nReferenced productions are defined in the [formal grammar](grammar.html).\n\n## Operands\n\n${list(command.operands)}\n\n${variantSections.join("\n\n")}\n\n## ${command.exampleRole === "caution" ? "Restriction example" : "Usage example"}: ${profileNames(command.exampleProfiles)}\n\n${command.exampleRole === "caution" ? "This example illustrates the named profile restriction described above.\n\n" : ""}\`\`\`bpa\n${sample}\n\`\`\`\n\n[Download example](${command.example}).`,
  );
  emit(command.example, sample);
  examples[command.exampleRole].push(
    `### [${command.name}](command-${command.name}.html): ${profileNames(command.exampleProfiles)}\n\n${command.purpose}\n\n\`\`\`bpa\n${sample}\n\`\`\`\n\n${command.exampleRole === "caution" ? exampleVariants.map((variant) => variant.behavior).join("\n\n") : "Read the command entry for its operands, context, and behavior."}`,
  );
  catalog.concepts.push(command, {
    id: `${command.id}.example`,
    kind: "example",
    profiles: command.exampleProfiles,
    source: sample,
  });
  catalog.relationships.push(
    { from: command.id, type: "demonstratedBy", to: `${command.id}.example` },
    ...command.exampleProfiles.map((id) => ({
      from: `${command.id}.example`,
      type: "appliesTo",
      to: `bpa.profile.${id}`,
    })),
    ...command.related.map((to) => ({
      from: command.id,
      type: "relatedTo",
      to,
    })),
  );
  for (const [index, operand] of command.operands.entries()) {
    const id = `${command.id}.operand.${index + 1}`;
    catalog.concepts.push({ id, kind: "operand", name: operand });
    catalog.relationships.push({ from: command.id, type: "accepts", to: id });
  }
  for (const variant of command.variants) {
    for (const profile of variant.profiles) {
      const variantId = `${command.id}.variant.${profile}`;
      const behaviorId = `${command.id}.behavior.${profile}`;
      catalog.concepts.push(
        {
          id: variantId,
          kind: "command-variant",
          profile,
          status: variant.status,
        },
        { id: behaviorId, kind: "behavior", profile, text: variant.behavior },
      );
      catalog.relationships.push(
        { from: command.id, type: "hasVariant", to: variantId },
        { from: variantId, type: "appliesTo", to: `bpa.profile.${profile}` },
        { from: variantId, type: "hasBehavior", to: behaviorId },
      );
      for (const [index, constraint] of variant.constraints.entries()) {
        const id = `${command.id}.constraint.${profile}.${index + 1}`;
        catalog.concepts.push({
          id,
          kind: "constraint",
          profile,
          text: constraint,
        });
        catalog.relationships.push({
          from: variantId,
          type: "constrainedBy",
          to: id,
        });
      }
      if (variant.example) {
        const id = `${command.id}.example.${profile}`;
        catalog.concepts.push({
          id,
          kind: "example",
          profiles: [profile],
          source: await read(variant.example),
        });
        catalog.relationships.push(
          { from: variantId, type: "demonstratedBy", to: id },
          { from: id, type: "appliesTo", to: `bpa.profile.${profile}` },
        );
      }
    }
  }
}
for (const step of steps) {
  const text = await read(step.example);
  const example = JSON.parse(text);
  if (!step.profiles.includes(example.profile))
    throw new Error(
      `${step.id} example is outside its declared execution profiles.`,
    );
  const fields = (entries) =>
    list(Object.entries(entries).map(([name, type]) => `\`${name}\`: ${type}`));
  page(
    `step-${step.name}`,
    `# ${step.name}\n\n${step.purpose}\n\n**Profiles: ${profileNames(step.profiles)}.**\n\nRepresentation: **${step.representation}**. This is the specification's normalized browser JSON notation, not a server instruction format. The host determines which steps its editor exposes.\n\n## Required fields\n\n${fields(step.required)}\n\n## Optional fields\n\n${fields(step.optional)}\n\nSee [structured steps](structured-steps.html) for sequencing and field conventions.\n\n## Behavior\n\n${step.behavior}\n\n## Example: ${profileNames([example.profile])}\n\n\`\`\`json\n${text}\n\`\`\`\n\n[Download example](${step.example}).`,
  );
  emit(step.example, text);
  examples.steps.push(
    `- [${step.name}](step-${step.name}.html) — ${step.purpose} [JSON example](${step.example}).`,
  );
  catalog.concepts.push(
    { ...step, kind: "step" },
    {
      id: `${step.id}.example`,
      kind: "example",
      profiles: [example.profile],
      source: example,
    },
    {
      id: `${step.id}.behavior`,
      kind: "behavior",
      profiles: step.profiles,
      text: step.behavior,
    },
  );
  catalog.relationships.push(
    { from: step.id, type: "demonstratedBy", to: `${step.id}.example` },
    { from: step.id, type: "hasBehavior", to: `${step.id}.behavior` },
    ...step.profiles.map((profile) => ({
      from: step.id,
      type: "appliesTo",
      to: `bpa.profile.${profile}`,
    })),
    {
      from: `${step.id}.example`,
      type: "appliesTo",
      to: `bpa.profile.${example.profile}`,
    },
  );
}
const conceptIds = new Set(catalog.concepts.map((concept) => concept.id));
if (conceptIds.size !== catalog.concepts.length)
  throw new Error("Duplicate catalog concept identifiers.");
for (const edge of catalog.relationships)
  if (!conceptIds.has(edge.from) || !conceptIds.has(edge.to))
    throw new Error("Dangling catalog relationship.");
emit("catalog.json", JSON.stringify(catalog, null, 2) + "\n");
page(
  "examples",
  `# Language examples\n\nEach example identifies its execution profile. Similar syntax can behave differently in another profile. Host services, schemas, navigation targets, and UI actions depend on the surrounding application.\n\n## Text examples\n\n${examples.usage.join("\n\n")}\n\n## Restrictions\n\nThese forms are included to explain their profile-specific limitations. Read their command entries before using them.\n\n${examples.caution.join("\n\n")}\n\n## Additional profile-specific examples\n\n${examples.variants.join("\n\n")}\n\n## Browser structured step examples\n\n${examples.steps.join("\n")}`,
);
page(
  "index",
  `# ${title}\n\n*${subtitle}*\n\n${purpose}\n\n[MIT License](license.html)\n\nA description of shared Edit Data syntax, browser BPA behavior, server engine behavior, and Groovy integration. Choose an execution profile before interpreting a command.\n\n## Execution profiles\n\n${profileTable}\n\nEngine 1.0 has separate browser and server profiles. Framework 2.1 compatibility is a legacy browser mode, not engine 2.1. Groovy is a separate language with a framework integration contract. The groovy profile groups library integration; numbered engine settings can also pass library engine validation. That grouping does not impose an exclusive library engine or establish successful save, compilation, or execution.\n\nStart with [engine profiles](engine-profiles.html), the [execution model](execution-model.html), or [Groovy integration](groovy-integration.html). Browse the [examples](examples.html) alongside their command and step descriptions.\n\n## Commands\n\nEach command has a complete applicability table and separate behavior descriptions. Supported, limited, unsafe, unavailable, and no-step describe that command in the named profile.\n\n${commands.map((command) => `- [${command.name}](command-${command.name}.html) — ${command.purpose}`).join("\n")}\n\n## Browser structured steps\n\nThese entries describe browser authorable and expanded representations. Available editor choices depend on the host. They do not define server instruction formats.\n\n${steps.map((step) => `- [${step.name}](step-${step.name}.html) — **${step.representation}**: ${step.purpose}`).join("\n")}\n\n## Machine-readable reference\n\n[Language catalog](catalog.json) contains stable command and step identifiers, execution profiles, per-profile applicability, operands, constraints, behaviors, examples, and relationships. Profile-qualified behavior identifiers prevent browser restrictions from being applied to server execution.\n\n- [Profile grammars](grammar.html)\n- [Profile language contracts](profile-contracts.json)\n- [Profile contract schema](profile-contracts.schema.json)\n- [Shared Edit Data grammar](EditData.g4)\n- [Execution profile schema](profiles.schema.json)\n- [Command reference schema](commands.schema.json)\n- [Step reference schema](step-reference.schema.json)\n- [Browser structured step notation schema](steps.schema.json)`,
);

// Replace only this generator's resolved output directory. Reject linked paths
// before removal so a local link cannot turn a rebuild into an external write.
async function assertUnlinkedTree(path) {
  const status = await lstat(path);
  if (status.isSymbolicLink()) throw new Error(`Linked site output: ${path}`);
  if (status.isDirectory())
    for (const entry of await readdir(path))
      await assertUnlinkedTree(join(path, entry));
}
if (dirname(outputRoot) !== root || relative(root, outputRoot) !== "site")
  throw new Error("Unexpected site output directory.");
try {
  await assertUnlinkedTree(outputRoot);
  if ((await realpath(outputRoot)) !== outputRoot)
    throw new Error("Site output does not resolve to the project directory.");
  await rm(outputRoot, { recursive: true });
} catch (error) {
  if (error.code !== "ENOENT") throw error;
}
await mkdir(outputRoot, { recursive: true });
for (const [name, content] of output) {
  const destination = resolve(outputRoot, name);
  if (!inside(outputRoot, destination))
    throw new Error(`Unsafe output: ${name}`);
  await mkdir(dirname(destination), { recursive: true });
  await writeFile(destination, content);
}
console.log(
  `Built scripting specification: ${profiles.length} execution profiles, ${commands.length} commands, ${steps.length} browser structured steps, and ${catalog.concepts.length} concepts.`,
);
