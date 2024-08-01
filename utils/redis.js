import { createClient } from 'redis';
import { promisify } from 'util';
/**
 * Performs Redis client operations
 */

class RedisClient {
  /**
   * Instantiate a new redis client
   */

  constructor() {
    this.client = createClient();
    this.getAsyncFunc = promisify(this.client.get).bind(this.client);

    this.isClientConnected = true;
    this.client.on('error', (err) => {
      console.log(`Redis client not connected to the server: ${err.message}`);
      this.isClientConnected = false;
    });

    this.client.on('connect', () => {
      this.isClientConnected = true;
    });
  }

  /**
   * Checks if the connection to redis was a success
   */
  isAlive() {
    return this.isClientConnected;
  }

  /**
   * Gets the value associated with the key in redis
   */
  async get(key) {
    const value = await this.getAsyncFunc(key);
    return value;
  }

  /**
   * Creates a new key, value pair in redis with an expiration time
   */
  async set(key, value, duration) {
    await promisify(this.client.setex)
      .bind(this.client)(key, duration, value);
  }

  /**
   * Removes the value associated with the given key from redis
   */
  async del(key) {
    await promisify(this.client.del).bind(this.client)(key);
  }
}

const redisClient = new RedisClient();

export default redisClient;
