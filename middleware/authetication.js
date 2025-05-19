import jwt from 'jsonwebtoken';

const authenticateJWT = (req, res, next) => {
  const token = req.headers['authorization']; // Assumes token is sent in the "Authorization" header

  if (!token) {
    return res.status(403).json({ message: "Access denied, token is missing" });
  }

  jwt.verify(token, 'your-secret-key', (err, user) => {
    if (err) {
      return res.status(403).json({ message: "Invalid or expired token" });
    }
    req.user = user; // Attach the user data from the token to the request
    next();
  });
};

export default authenticateJWT;
