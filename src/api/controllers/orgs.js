'use strict';

/**
 * @module orgs
 * @author Alteh Union (alteh.union@gmail.com)
 * @license MIT (see the root LICENSE file for details)
 */

const jwt = require('jsonwebtoken');
const ObjectId = require('mongodb').ObjectId;

/**
 * Gets the list of organizations available for the user.
 * The Bot should be present in the organization in order to include it here.
 * @param  {Request}  req  the express object representing the web-request to this endpoint
 * @param  {Response} res  the express object representing the web-response from this endpoint
 * @param  {Function} next the callback function to the next middleware in the express stack
 */
const getUserOrgs = async (req, res, next) => {
  try {
    if (req.headers && req.headers.authorization) {
      const context = req.app.get('context');

      const authorization = req.headers.authorization.split(' ')[1];
      let decoded;
      try {
        decoded = jwt.verify(authorization, context.prefsManager.jwt_secret);
      } catch (e) {
        return res.status(401).send('Unauthorized');
      }

      var userId = decoded.sub;
      const users = context.dbManager.dbo.collection('users');
      const searchCriteria = { '_id': new ObjectId(userId) };
      const user = await users.findOne(searchCriteria);
      if (!user) {
        return res.status(401).send('Unauthorized');
      }

      const orgsArray = context.discordClient.guilds.cache.array();
      const userOrgs = [];
      for (const org of orgsArray) {
        const collection = await org.members.fetch();
        const filteredMembers = collection.filter(entity => entity.id === user.discordInfo.id);
        let iconLink = null;
        if (org.icon) {
          iconLink = "https://cdn.discordapp.com/icons/" + org.id + "/" + org.icon + ".png";
        }
        if (filteredMembers.size > 0) {
          userOrgs.push({ id: org.id, icon: iconLink, name: org.name, nameAcronym: org.nameAcronym });
        }
      }

      res.status(200).send({ userOrgs: userOrgs });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Exports the functions to handle org-related web-endpoints for UI clients.
 */
module.exports = {
  getUserOrgs
};
