import jwt from 'jsonwebtoken';
import { connect, disconnect, getDb } from '../database.js';

const JWT_SECRET = '1234';

const adminLogin = async (req, res) => {
  const { email, password } = req.body;

  try {
    await connect();
    const db = getDb();

    const user = await db.collection('users').findOne({ email, password });

    if (user) {
      // Create JWT token with email payload
      const token = jwt.sign({ email }, JWT_SECRET, { expiresIn: '100h' });

      // Set token in HTTP-only cookie
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 1000, // 1 hour
      });

      // Render homepage
     return res.redirect('/admin/homepage');
    } else {
      res.render('login', { title: 'Login', error: 'Invalid email or password' });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.render('login', { title: 'Login', error: 'Something went wrong. Please try again.' });
  } finally {
    await disconnect();
  }
};

export default adminLogin;
