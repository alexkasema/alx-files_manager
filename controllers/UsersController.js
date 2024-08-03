import { ObjectId } from 'mongodb';
import sha1 from 'sha1';
import Queue from 'bull';
import dbClient from '../utils/db';
import userUtils from '../utils/user';

const userQueue = new Queue('userQueue');

class UsersController {
  // Creates a user given an email and password
  static async postNew(req, res) {
    const { email, password } = req.body;

    if (!email) return res.status(400).json({ error: 'Missing email' });

    if (!password) return res.status(400).json({ error: 'Missing password' });

    const user = await dbClient.usersCollection.findOne({ email });

    if (user) return res.status(400).json({ error: 'Already exist' });

    const sha1Password = sha1(password);

    let newUser;

    try {
      newUser = await dbClient.usersCollection.insertOne({
        email,
        password: sha1Password,
      });
    } catch (err) {
      await userQueue.add({});
      return res.status(500).json({ error: 'Error creating user.' });
    }

    await userQueue.add({
      userId: newUser.insertedId.toString(),
    });

    return res.status(201).json({ id: newUser.insertedId, email });
  }

  // should retrieve the user base on the token used
  static async getMe(req, res) {
    const { userId } = await userUtils.getUserIdAndKey(req);

    const user = await userUtils.getUser({
      _id: ObjectId(userId),
    });

    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    return res.status(200).json({ id: user._id.toString(), email: user.email });
  }
}

export default UsersController;
