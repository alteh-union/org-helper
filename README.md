# org-helper
A Discord bot with MongoDB backend to help organizing guilds

## Dev installation for Windows:

- Install MongoDB, NodeJS, and NPM on your local machine
- Use GitHub desktop app to clone the repository (alteh-union/org-helper) into a local directory or clone it using Git console tools (for example, Git BASH):
```
git clone https://github.com/alteh-union/org-helper.git --branch master
```
- Move into the folder:
```
cd org-helper
```
- Copy-paste preferences_template.txt file into preferences.txt
- Change the preferences as you need. E.g. set discord_token to the actual token of your bot (and of course, register a bot in the Discord website if not done yet - https://discord.com/developers/applications).
- In the preferences.xml file, set db_name to the name of database you want to use (the Bot will create it automatically on start up, if it does not exist yet)
- Install the required Node modules:
```
npm install
```
- Run the bot using the node command:
```
node src/index.js
```
