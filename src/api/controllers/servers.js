const jwt = require('jsonwebtoken');
const ObjectId = require('mongodb').ObjectId;

const getUserServers = async (req, res, next) => {
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

      const serversArray = context.discordClient.guilds.cache.array();
      const userServers = [];
      for (const server of serversArray) {
        const collection = await server.members.fetch();
        const filteredMembers = collection.filter(entity => entity.id === user.discordInfo.id);
        if (filteredMembers.size > 0) {
          userServers.push({ id: server.id, icon: server.icon, name: server.name, nameAcronym: server.nameAcronym });
        }
      }

      res.status(200).send({ userServers: userServers });
    }
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUserServers
};
