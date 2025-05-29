import jwt from 'jsonwebtoken';

const JWT_SECRET = '1234'; 

const verifyToken = (req, res, next) => {
  const token = req.cookies.token;

  if (!token) {
    return res.redirect('/login');
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; 
    next();
  } catch (err) {
    console.error('JWT verification failed:', err);
    res.clearCookie('token');
    return res.redirect('/login');
  }
};

export default verifyToken;