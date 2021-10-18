'use strict';

/**
 * @module error-handler
 * @author Alteh Union (alteh.union@gmail.com)
 * @license MIT (see the root LICENSE file for details)
 */

/**
 * Handles the errors thrown by the express app and send the reply back to the client.
 * @param  {Error}    err  the express object representing the web-request to this endpoint
 * @param  {Request}  req  the express object representing the web-request to this endpoint
 * @param  {Response} res  the express object representing the web-response from this endpoint
 * @param  {Function} next the callback function to the next middleware in the express stack
 */
function errorHandler(err, req, res, next) {
  if (err.name === 'UnauthorizedError' || err.message === 'Unauthorized error') {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  console.error(err);
  return res.status(500).json({ message: 'Something goes wrong' });
}

/**
 * Exports the function to handle errors for UI clients.
 */
module.exports = errorHandler;
