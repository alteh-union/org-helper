'use strict';

class BaseSource {

  constructor(client) {
    this.client = client;
  }

  async replyToMessage(message, replyText) {
    throw new Error('BaseSource is an abstract class');
  }
}

module.exports = BaseSource;
