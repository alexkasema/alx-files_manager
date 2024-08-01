import redisClient from '../utils/redis';
import dbClient from '../utils/db';

class AppController {
  // should return if Redis is alive and if the DB is alive
  static getStatus(req, res) {
    res.status(200).json(
      { redis: redisClient.isAlive(), db: dbClient.isAlive() },
    );
  }

  // should return the number of users and files in DB
  static getStats(req, res) {
    Promise.all([dbClient.nbUsers(), dbClient.nbFiles()])
      .then(([numUsers, numFiles]) => {
        res.status(200).json({ users: numUsers, files: numFiles });
      });
  }
}

export default AppController;
