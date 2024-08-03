import { expect, use, should, request } from 'chai';
import { ObjectId } from 'mongodb';
import chaiHttp from 'chai-http';
import sinon from 'sinon';
import app from '../server';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

use(chaiHttp);
should();

// Test User Endpoints

describe('Testing User Endpoints', () => {
  const credentials = 'Basic Ym9iQGR5bGFuLmNvbTp0b3RvMTIzNCE=';
  const user = {
    email: 'bob@dylan.com',
    password: 'toto1234!',
  };
  let token = '';
  let userId = '';

  before(async () => {
    await redisClient.client.flushall('ASYNC');
    await dbClient.usersCollection.deleteMany({});
    await dbClient.filesCollection.deleteMany({});
  });

  after(async () => {
    await redisClient.client.flushall('ASYNC');
    await dbClient.usersCollection.deleteMany({});
    await dbClient.filesCollection.deleteMany({});
  });

  // users
  describe('post request /users', () => {
    it('Should return id and email of created user', async () => {
      const res = await request(app).post('/users').send(user);
      const body = JSON.parse(res.text);
      expect(body.email).to.equal(user.email);
      expect(body).to.have.property('id');
      expect(res.statusCode).to.equal(201);

      userId = body.id;
      const isUser = await dbClient.usersCollection.findOne({
        _id: ObjectId(userId),
      });

      expect(isUser).to.exist;
    });

    it('Should not create user if password is missing', async () => {
      const user = { email: 'bob@dylan.com' };

      const res = await request(app).post('/users').send(user);
      const body = JSON.parse(res.text);
      expect(body).to.eql({ error: 'Missing password' });
      expect(res.statusCode).to.equal(400);
    });

    it('Should not create user if email is missing', async () => {
      const user = { password: 'toto1234!' };
      
      const res = await request(app).post('/users').send(user);
      const body = JSON.parse(res.text);
      expect(body).to.eql({ error: 'Missing email' });
      expect(res.statusCode).to.equal(400);
    });

    it('Should not create user if user already exists', async () => {
      const user = {
        email: 'bob@dylan.com',
        password: 'toto1234!', 
      };

      const res = await request(app).post('/users').send(user);
      const body = JSON.parse(res.text);
      expect(body).to.eql({ error: 'Already exist' });
      expect(res.statusCode).to.equal(400);
    });
  });

  // test Auth Connect
  describe('test get request /connect', () => {
    it('Should not generate token if no user is passed', async () => {
      const res = await request(app).get('/connect').send();
      const body = JSON.parse(res.text);
      expect(body).to.eql({ error: 'Unauthorized' });
      expect(res.statusCode).to.equal(401);
    });

    it('Should return a token if user credentials are passed', async () => {
      const spyRedisSet = sinon.spy(redisClient, 'set');

      const res = await request(app)
        .get('/connect')
        .set('Authorization', credentials)
        .send();

      const body = JSON.parse(res.text);
      token = body.token;
      expect(body).to.have.property('token');
      expect(res.statusCode).to.equal(200);

      expect(
        spyRedisSet.calledOnceWithExactly(`auth_${token}`, userId, 24 * 3600),
      ).to.be.true;

      spyRedisSet.restore();
    });

    it('Check if token exists in redis', async () => {
      const redisToken = await redisClient.get(`auth_${token}`);
      expect(redisToken).to.exist;
    });
  });

  // Test Auth Disconnect
  describe('Test request get /disconnect', () => {
    after(async () => {
      await redisClient.client.flushall('ASYNC');
    });

    it('Should return Unauthorized if there is no token', async () => {
      const res = await request(app).get('/disconnect').send();
      const body = JSON.parse(res.text);
      expect(body).to.eql({ error: 'Unauthorized' });
      expect(res.statusCode).to.equal(401);
    });

    it('Should sign out a user if token is present', async () => {
      const res = await request(app)
        .get('/disconnect')
        .set('X-Token', token)
        .send();
      expect(res.text).to.be.equal('');
      expect(res.statusCode).to.equal(204);
    });

    it('Token should not exist in redis when user signs out', async () => {
      const redisToken = await redisClient.get(`auth_${token}`);
      expect(redisToken).to.not.exist;
    });
  });

  // test User retrieval based on token used
  describe('Test request get /users/me', () => {
    before(async () => {
      const res = await request(app)
        .get('/connect')
        .set('Authorization', credentials)
        .send();
      const body = JSON.parse(res.text);
      token = body.token;
    });

    it('Should return Unauthorized if no token is passed', async () => {
      const res = await request(app).get('/users/me').send();
      const body = JSON.parse(res.text);

      expect(body).to.be.eql({ error: 'Unauthorized' });
      expect(res.statusCode).to.equal(401);
    });

    it('Should retrieve user based on token provided', async () => {
      const res = await request(app)
        .get('/users/me')
        .set('X-Token', token)
        .send();
      const body = JSON.parse(res.text);

      expect(body).to.be.eql({ id: userId, email: user.email });
      expect(res.statusCode).to.equal(200);
    });
  });
});
