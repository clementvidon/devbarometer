COMMIT FORMAT GUIDELINE
----------------------------------------

TITLE
- Max 50 chars
- Imperative
- Message starts with lowercase
- No period

FORMAT
- <type>(<scope>): <action>
- <type>: <action> (if no relevant scope)

TYPES
- feat:      new feature (and its tests)
- fix:       bug fix
- chore:     misc tasks (no src/test impact)
- docs:      documentation
- refactor:  internal code change (no bug/feature)
- test:      add or update tests
- style:     formatting (spacing, lint)
- ui:        visual changes (layout, CSS)
- build:     tooling, deps, build system
- ci:        CI/CD changes
- perf:      performance improvement
- wip:       temporary work (to squash later)
- revert:    undo a commit

SCOPE
- Should be used when it adds clarity
- Should match a module, feature, or domain (api, relevance, weights, snapshot, etc.)
- Do NOT duplicate information already present in the type
- Prefer scopes that map to a part of the system architecture (module, domain, layer)
- Avoid generic scopes like "docs", "test", "code" unless no better scope exists
- Scope should add new information not already present in type or message

Examples:

- docs(docs): update readme → WRONG
- test(test): add unit tests → WRONG
- docs: update readme → GOOD
- test(api): add endpoint tests → GOOD

MESSAGE
- Be specific and explicit
- Use verb-first phrasing (imperative form)
- Avoid vague messages like: "refine code", "improve logic", "fix stuff"
- Avoid generic words without context (code, logic, things)
- The message must describe the concrete change, not the intention
- Prefer clear actions:
  - add X
  - remove X
  - rename X to Y
  - fix X
  - refactor X
