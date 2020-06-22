'use strict';

class DiscordModule {
  constructor(context) {
    this.c = context;
    this.client = context.discordClient;
  }

  run() {


    this.client.on('ready', async () => {
      try {
        this.c.log.i('Servers:');
        const guildsArray = this.client.guilds.cache.array();
        const updateResults = [];
        for (const guild of guildsArray) {
          this.c.log.i(' - ' + guild.name);
          updateResults.push(this.c.dbManager.updateGuild(guild));
        }

        await Promise.all(updateResults);

        this.c.discordCommandsParser.setDiscordClient(this.client);
        this.c.messageModerator.setDiscordClient(this.client);
        await this.c.dbManager.updateGuilds(this.client.guilds.cache);
        this.c.discordClientReady = true;

        await this.c.scheduler.syncTasks();
      } catch (error) {
        this.c.log.f('client on ready error: ' + error + '; stack: ' + error.stack);
      }
    });

    this.client.on('message', async message => {
      if (!this.c.discordClientReady) {
        this.c.log.w('on message: the client is not ready');
        return;
      }

      try {
        await this.c.dbManager.updateGuilds(this.client.guilds.cache);
        await this.c.scheduler.syncTasks();

        if (message.guild !== undefined && message.guild !== null) {
          await this.c.dbManager.updateGuild(message.guild);

          let processed = false;
          if (message.author.id !== this.client.user.id) {
            processed = await this.c.discordCommandsParser.parseDiscordCommand(message);
            if (!processed) {
              this.c.messageModerator.premoderateDiscordMessage(message);
            }
          }
        } else {
          // The null guild means it's a private ("DM") message
          await this.c.discordCommandsParser.parsePrivateDiscordCommand(message);
        }
      } catch (error) {
        this.c.log.e('client on message error: ' + error + '; stack: ' + error.stack);
      }
    });

    this.client.login(this.c.prefsManager.discord_token);
  }
}

module.exports = DiscordModule;
