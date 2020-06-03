# Contribution guide

- [Code of Conduct](https://github.com/alteh-union/org-helper/blob/master/.github/CODE_OF_CONDUCT.md)

- Contribute to the master branch.
- Use ESLint tool for checking the coding standards, style, best practices etc.
- Make sure ESLint does not point to any error after the check. If there are false positives - justify them by providing a comment right before the line which gave the error, and disable the specific error check using the ESLint directive. Like here:
```
// Must scan arguments one by one, since it's a sequential scan, and results depend on previous scanning.
/* eslint-disable no-await-in-loop */
const scanResult = await definedArgs[argKey].scanner.scan(this.context, this.langManager, discordMessage, defaultValue);
/* eslint-enable no-await-in-loop */
```
or here:
```
async executeForDiscord(discordMessage) {
  // Inherited function with various possible implementations, some args may be unused.
  /* eslint no-unused-vars: ["error", { "args": "none" }] */
```
- Note: your changes will be ran thru ESLint --fix and Prettier --write scripts via husky webhooks before commiting them. In general this should automatically fix most code style and code formatting issue, but it's also good to run the tools manually to avoid unexpected changes.
- Provide JSDoc comments to all functions and exported classes. Additional comments are welcome for unclear, non-obvious parts of code. Yes, we know: the Bot is not a library and does not have an API. But it still helps a lot for developers to quickly understand what your code does and why.
- After documenting your code - run jsdoc to make sure it does not produce any errors/warnings on your code.
- Prepare a commit message for your changes using the following rule: TBD
- Submit a pull request with your commit using the following template: [Pull Request Template](https://github.com/alteh-union/org-helper/blob/master/.github/PULL_REQUEST_TEMPLATE.md)
