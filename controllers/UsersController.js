import sha1 from 'sha1';
import dbClient from '../utils/db';

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
      return res.status(500).json({ error: 'Error creating user.' });
    }

    return res.status(201).json({ id: newUser.insertedId, email });
  }
}

export default UsersController;
