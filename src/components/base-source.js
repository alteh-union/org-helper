'use strict';

const DEFAULT_COMMAND_PREFIX = '!';

class BaseSource {

  constructor(client) {
    this.client = client;
  }

  async replyToMessage(message, replyText) {
    throw new Error('BaseSource is an abstract class');
  }

  get name() {
    throw new Error('BaseSource is an abstract class');
  }

  get DEFAULT_COMMAND_PREFIX() {
    return DEFAULT_COMMAND_PREFIX;
  }
}

module.exports = BaseSource;
