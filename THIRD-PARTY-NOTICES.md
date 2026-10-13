# Third-party tooling

This project uses dependencies installed through npm; it does not vendor their
source trees. Exact versions and integrity hashes are recorded in `package-lock.json`.

| Package    | Role                                 | License      |
| ---------- | ------------------------------------ | ------------ |
| ajv        | Documentation and example schemas    | MIT          |
| antlr-ng   | Development-only grammar generation  | MIT          |
| antlr4ng   | Development-only example parsing     | BSD-3-Clause |
| marked     | Documentation rendering and fences   | MIT          |
| prettier   | Formatting                           | MIT          |
| typescript | Development-only grammar compilation | Apache-2.0   |

The lockfile also includes these transitive dependencies:

| Package              | Role                       | License      |
| -------------------- | -------------------------- | ------------ |
| base64-js            | Grammar tooling dependency | MIT          |
| commander            | Grammar tooling dependency | MIT          |
| fast-deep-equal      | Schema tooling dependency  | MIT          |
| fast-printf          | Grammar tooling dependency | BSD-3-Clause |
| fast-uri             | Schema tooling dependency  | BSD-3-Clause |
| he                   | Grammar tooling dependency | MIT          |
| json-schema-traverse | Schema tooling dependency  | MIT          |
| luxon                | Grammar tooling dependency | MIT          |
| pako                 | Grammar tooling dependency | MIT          |
| require-from-string  | Schema tooling dependency  | MIT          |
| stringtemplate4ts    | Grammar tooling dependency | MIT          |
| tiny-inflate         | Grammar tooling dependency | MIT          |
| unicode-properties   | Grammar tooling dependency | MIT          |
| unicode-trie         | Grammar tooling dependency | MIT          |

The grammar toolchain also installs a transitive copy of `antlr4ng` under the
same BSD-3-Clause license. The lockfile distinguishes it from the pinned direct
development dependency.

Refer to each installed package's license file for its complete terms and
copyright notices. Any future redistributed dependency bundle must preserve
the applicable notices. The formal grammar is written in ANTLR syntax; this
repository does not distribute a parser or language runtime.
