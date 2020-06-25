## Git Commit Message Convention

> This is adapted from [Angular's commit convention](https://github.com/conventional-changelog/conventional-changelog/tree/master/packages/conventional-changelog-angular)
> with significant modifications.

### Full Message Format

A commit message consists of a **header** and **body**. The header has a **type**, **scope** and **subject**:

```
<type>(<scope>): <subject>
<BLANK LINE>
<body>
```

The **header** is mandatory and the **scope** of the header is optional.

### Header

Message headers must be matched by the following regex:

```js
/^(revert: )?(feat|fix|docs|style|refactor|perf|test|workflow|build|ci|chore)(\(.+\))?: .{1,72}/;
```

Note that the maximum length of the header is 72 symbols.

#### Examples of headers

```
feat(moderation): Add 'tempban' Discord command
```

```
fix(#28): Fix scheduling over Daylight Saving Time
```

```
workflow(lint-staged): Add support of lint-staged package
```

#### Type

Suggested prefixes are: `feat` (for features), `fix` (for bug fixes), `docs` (for changing projects' docs, like this
one), `style` (code styling/formatting), `refactor`, `perf` (performance), `test`, `workflow`, `build`, `ci`
(for continuous integration), `chore` (various small changes).

#### Scope

The scope could be anything specifying the place of the commit change. For example `core`, `moderation`, `ESLint`,
`help`, `E2E tests` etc.

However, for bug fixes (**type** = `fix`) the scope must include the issue number following "#" sign (e.g. `#53`).
If multiple bugs are closed by the commit, then join the numbers by comma, like `#57, #104`.

#### Subject

The subject contains a succinct description of the change:

- use the imperative, present tense: "change", not "changed" nor "changes"
- Capitalize the first letter
- no dot (.) at the end

#### Body

Just as in the **subject**, use the the imperative, present tense: "change", not "changed" nor "changes".
The body **must** include information about **what** was the change and **why** it was made.

For fixes it's typically not enough to say `fixes #45` as the reason for the change. Please also explain
why did you fix the issue this way and not that way. E.g. you need to explain what is the root cause of the issue.

The body also should not violate the limit of 72 symbols per row.

### Revert

If the commit reverts a previous commit, it should begin with `revert:`, followed by the header of the reverted commit. In the body, it should say: `This reverts commit <hash>.`, where the hash is the SHA of the commit being reverted.

```
revert: feat(moderation): Added 'tempban' Discord command

This reverts commit 45adca759b37cc5107a8e7ff6e244ca8.
```
