const jwt = require('jsonwebtoken');

function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Please log in to continue.'
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const userId = Number(decoded.sub);

    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(401).json({ error: 'Invalid token.' });
    }
req.user = {
  id: userId,
  name: decoded.name,
  email: decoded.email
};
    next();
  } catch (error) {
    return res.status(401).json({
      error: 'Invalid or expired token. Please log in again.'
    });
  }
}

module.exports = authenticateToken;