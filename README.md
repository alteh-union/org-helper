# org-helper
A Discord bot on Discord.js library with MongoDB backend to help organizing guilds

## Useful links

Invite the main Production instance of the bot using top.gg: https://top.gg/bot/714175230809210952 (or by using the following link: https://discord.com/api/oauth2/authorize?client_id=714175230809210952&permissions=8&scope=bot)

User guides for the main Production instance (the OrgHelper itself):
- In English: http://alteh.org/orghelper-english/
- In Russian: http://alteh.org/orghelper-%d1%80%d1%83%d1%81%d1%81%d0%ba%d0%b8%d0%b9/

## What makes the difference (a.k.a. why one more bot)?

- Highly customizable
- Rich meta classes and infrastructure
- Scallable architecture, can easily add the support of multiple platforms
- Code quality is somewhat close to the enterprise grade

## Dev installation:

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

## Production launch

We recommend to use the PM2 process manager on production instances. The Bot is capable of manipulating images which sometimes may cause problems on native layers that cannot be caught by NodeJS.
In order to reanimate the Bot's process automatically, launch the instance through PM2.

- Install the PM2 package globally:
```
npm install pm2 -g
```
- Run instance using PM2:
```
pm2 start src/index.js
```
- See more info on how to list, monitor and delete running instances on the official PM2 page: https://www.npmjs.com/package/pm2

## Development roadmap

- Short term: Telegram bot
- Mid term: Web client, language synchronization between the Android app and the Bot's server, different help strings for UI clients (Web and Android), private settings and commands
- Long term: ML-chat bot, speech-to-text for auto-logging meeting minutes, gamification, implementation of liquid/hybrid democracy

Wanna speed up the development and take one of the features on your own? Contact us at: alteh.union@gmail.com. This is not to restict you, but just to make sure several developers do not interfere with each other.

## How to add a new command

1) Check out the existing commands and pick the one which is mostly similar to the one you want to create
2) Create a new module and class based on the chosen in the respective commands folder
3) Define arguments for the command. Check existing commands as examples, look at arg_scanners folder to see what arg scanners suit the args most, and for available arg validations - check ArgValidationTree class. Of course, you can add new types of scanners and validations if you feel you need it.
4) Inherited functions in the Command class which you PROBABLY will need to override are: getDefaultArgValue, validateArguments, getRequiredDiscordPermissions, getRequiredBotPermissions.
5) Inherited functions in the Command class which you DEFINITELY will need to override are: createForOrg, getCommandInterfaceName, getDefinedArgs, getHelpText, execute
6) The main logic of the command will need to be written in execute function (or in subfunctions called from that function)
7) Add related UI strings into "localization" folder, at least for the default (en-US) locale. Try to keep the same format of string identifiers as for the existing commands
8) Register the command in CommandParser class (Commands array for the org commands), so it considers the command while parsing the user messages
9) Depending on your logic, some commands may require additional modification in other places (like MessageModerator, PermissionManager, DB classes etc.)
10) If you adding a new Mongo entities (e.g. tables, rows), make sure it's possible not only to add them, but also to view them and remove them. In the majority of cases that will mean that you need to create more then 1 command at once (e.g. to add, to remove and to view some entities)
11) Prepare the patch according to the CONTRIBUTION_GUIDE

## How to add a new source (platform, like Slack, Telegram etc.)

1) In BotTable class add a new constant representing the newly added source (for example, "const SLACK_SOURCE = 'Slack';"). This new constant should be used to save all entities related to the new source, to distinguish it from entities from other sources. E.g. in OrgMember instances, OrgChannel, OrgTask etc. etc.
2) Add new commands folder for the source, e.g. src/commands_slack
3) Add a new base class for commands like SlackCommand inherited from Command class
4) Add necessary functions to it (some of them may be abstract and to be overrided by particular commands)
5) Add new folders structure inside your commands folder ("commands_slack") to place the source-related commands the (similarly to the Discord-related folders)
6) In the mongo_classes add new functions to work with the new source (e.g. in BotTable: updateFromDiscord -> updateFromSlack etc.)
7) Add at least some basic commands for the new platform (for example, "ping" command - see instructions on how to add new commands above)
8) In index.js file, instantiate the client of the new platform and add callback handlers for it. For example, the client should send an incoming text message to the CommandsParser class to check if it's a command, and to process it if it is
9) Add new preferences to preferences_template.txt and your instance of preferences.txt. For example, it could be a token of your bot in the new platform
10) Maybe some other steps
