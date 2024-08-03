import { expect, use, should, request } from 'chai';
import chaiHttp from 'chai-http';
import app from '../server';
import dbClient from '../utils/db';

use(chaiHttp);
should();

describe('Testing app database status endpoints', () => {
  describe('test request get /status', () => {
    it('Return connectivity status of redis and mongodb', async () => {
      const res = await request(app).get('/status').send();
      const body = JSON.parse(res.text);

      expect(body).to.eql({ redis: true, db: true });
      expect(res.statusCode).to.equal(200);
    });
  });

  describe('Testing the request get /stats:', () => {
    before(async () => {
      await dbClient.usersCollection.deleteMany({});
      await dbClient.filesCollection.deleteMany({});
    });

    it('Return number of users and files in db (0)', async () => {
      const res = await request(app).get('/stats').send();
      const body = JSON.parse(res.text);

      expect(body).to.eql({ users: 0, files: 0 });
      expect(res.statusCode).to.equal(200);
    });

    it('Return number of users(2) and files(2) in db', async () => {
      await dbClient.usersCollection.insertOne({ name: 'Jane' });
      await dbClient.usersCollection.insertOne({ name: 'John' });
      await dbClient.filesCollection.insertOne({ name: 'test.png' });
      await dbClient.filesCollection.insertOne({ name: 'test2.png' });
      
      const res = await request(app).get('/stats').send();
      const body = JSON.parse(res.text);

      expect(body).to.eql({ users: 2, files: 2 });
      expect(res.statusCode).to.equal(200);
    });
    
  });
});
