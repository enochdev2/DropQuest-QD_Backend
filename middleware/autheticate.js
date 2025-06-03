import jwt from 'jsonwebtoken';

export const authenticate = (req, res, next) => {
  const token = req.cookies.token || req.headers.authorization?.split(" ")[1];
  console.log("checking the backend", token);
  
  
  if (!token) {
    return res.status(401).json({ message: 'No token provided, authorization denied' });
  }

  try {
    // Verify the token and extract the user data
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY );
    req.user = decoded;  // Attach the user data to the request object
    next();  // Proceed to the next middleware or route handler
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

export const authorizeAdmin = (req, res, next) => {
  // Make sure authenticate middleware ran before this and set req.user
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized: No user info found" });
  }

  // Check if user has admin role - adjust field name as per your user model / JWT payload 
  if (req.user.admin) {
    return next();
  }

  return res.status(403).json({ message: "Forbidden: Admins only" });
};

