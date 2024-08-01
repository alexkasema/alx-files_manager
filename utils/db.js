import { MongoClient } from 'mongodb';

/**
 * A class for performing operations with MongoDB client
 */

const DB_HOST = process.env.DB_HOST || '127.0.0.1';
const DB_PORT = process.env.DB_PORT || 27017;
const DB_DATABASE = process.env.DB_DATABASE || 'files_manager';

const URL = `mongodb://${DB_HOST}:${DB_PORT}`;

class DBClient {
  constructor() {
    MongoClient.connect(URL, { useUnifiedTopology: true, family: 4 }, (err, client) => {
      if (!err) {
        // console.log('Connected successfully to database');
        this.db = client.db(DB_DATABASE);
        this.usersCollection = this.db.collection('users');
        this.filesCollection = this.db.collection('files');
      } else {
        console.log(err.message);
        this.db = false;
      }
    });
  }

  /**
   * Checks if connection to MongoDB is a success
   */
  isAlive() {
    return Boolean(this.db);
  }

  /**
   * Calculates the number of documents in the collection users
   */
  async nbUsers() {
    return this.usersCollection.countDocuments();
  }

  /**
   * Calculates the number of documents in the collection files
   */
  async nbFiles() {
    return this.filesCollection.countDocuments();
  }
}

const dbClient = new DBClient();

export default dbClient;
