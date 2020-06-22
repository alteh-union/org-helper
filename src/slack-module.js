'use strict';

const SlackCommandsParser = require('./managers/slack/slack-commands-parser');

class SlackModule {
  constructor(context) {
    this.c = context;
    this.client = context.discordClient;
  }

  run() {
    const { createEventAdapter } = require('@slack/events-api');
    const { WebClient } = require('@slack/web-api');

    const slackEvents = createEventAdapter(this.c.prefsManager.slack_signing_secret);
    const webClient = new WebClient(this.c.prefsManager.slack_token);
    const slackCommandsParser = new SlackCommandsParser(this.c, webClient);
    const slackServerPort = this.c.prefsManager.slack_server_port;

    slackEvents.on('message', async (message) => {
      console.log(`Received a message event: user ${message.user} in channel ${message.channel} says ${message.text}`);
      try {
        await slackCommandsParser.processSlackCommand(message);

      } catch (error) {
        this.c.log.e('client on message error: ' + error + '; stack: ' + error.stack);
      }
    });

    // All errors in listeners are caught here. If this weren't caught, the program would terminate.
    slackEvents.on('error', (error) => {
      console.log(error.name); // TypeError
    });

    (async () => {
      const server = await slackEvents.start(slackServerPort);
      console.log(`Listening for events on ${server.address().port}`);
    })();

  }
}

module.exports = SlackModule;
