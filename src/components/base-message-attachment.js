'use strict';

/**
 * @module base-message-attachment
 * @author Alteh Union (alteh.union@gmail.com)
 * @license MIT (see the root LICENSE file for details)
 */

const MimeTypes = Object.freeze({
  BASE64: "image/base64"
});


/**
 * An attachment with a corresponding MIME type to be used for command replies
 * @alias BaseMessageAttachment
 */
class BaseMessageAttachment {
  /**
   * Creates an attachment with a corresponding MIME type
   * @param {Object} attachment the attachment object itself
   * @param {string} mimeType   the MIME type to understand how to handle the message
   */
  constructor(attachment, mimeType) {
    this.attachment = attachment;
    this.mimeType = mimeType;
  }

  static get MIME_TYPES() {
    return MimeTypes;
  }
}

/**
 * Exports the BaseMessageAttachment class
 * @type {BaseMessageAttachment}
 */
module.exports = BaseMessageAttachment;
