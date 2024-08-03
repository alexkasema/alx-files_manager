import { expect, use, should } from 'chai';
import { promisify } from 'util';
import chaiHttp from 'chai-http';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

use(chaiHttp);
should();

describe('Testing the mongodb and redis clients', () => {
  // redisClient test
  describe('tests on redis client', () => {
    before(async () => {
      await redisClient.client.flushall('ASYNC');
    });

    after(async () => {
      await redisClient.client.flushall('ASYNC');
    });

    it('Should show connection is alive', () => {
      expect(redisClient.isAlive()).to.equal(true);
    });

    it('Return null if key does not exist', async () => {
      expect(await redisClient.get('myKey')).to.equal(null);
    });

    it('Check if a key is set without any errors', async () => {
      expect(await redisClient.set('myKey', 12, 5)).to.equal(undefined);
    });

    it('Should return null if key searched for has expired', async () => {
      const sleep = promisify(setTimeout);
      await sleep(5500);
      expect(await redisClient.get('myKey')).to.equal(null);
    });
  });

  // dbClient test
  describe('tests on db client', () => {
    before(async () => {
      await dbClient.usersCollection.deleteMany({});
      await dbClient.filesCollection.deleteMany({});
    });

    after(async () => {
      await dbClient.usersCollection.deleteMany({});
      await dbClient.filesCollection.deleteMany({});
    });

    it('Should show connection is alive', () => {
      expect(dbClient.isAlive()).to.equal(true);
    });

    it('Show the number of user documents in the db', async () => {
      await dbClient.usersCollection.deleteMany({});
      expect(await dbClient.nbUsers()).to.equal(0);

      await dbClient.usersCollection.insertOne({name: 'Jane'});
      await dbClient.usersCollection.insertOne({name: 'John'});
      expect(await dbClient.nbUsers()).to.equal(2);
    });

    it('Show the number of file documents in the db', async () => {
      await dbClient.filesCollection.deleteMany({});
      expect(await dbClient.nbFiles()).to.equal(0);
      
      await dbClient.filesCollection.insertOne({name: 'Jane'});
      await dbClient.filesCollection.insertOne({name: 'John'});
      expect(await dbClient.nbFiles()).to.equal(2);
    });
    
  });
});
