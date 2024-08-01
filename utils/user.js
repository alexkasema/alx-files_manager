import dbClient from './db';
import redisClient from './redis';

// Module containing usefull user utilities

const userUtils = {
  /**
   * Gets user from database
   * @query {object} query expression for finding user
   * @return {object} user document object
   */
  async getUser(query) {
    try {
      const user = await dbClient.usersCollection.findOne(query);
      return user;
    } catch (err) {
      console.log(err.message);
    }
    return null;
  },

  /**
   * Get user id and key of redis from request
   * @req: express request object
   * @return {object} containing userId and redis key for token
   */
  async getUserIdAndKey(req) {
    const obj = { userId: null, key: null };

    const xToken = req.header('X-Token');
    if (!xToken) return obj;

    obj.key = `auth_${xToken}`;
    obj.userId = await redisClient.get(obj.key);

    return obj;
  },
};

export default userUtils;
