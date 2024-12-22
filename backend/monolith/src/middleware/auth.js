const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  try {
    console.log('Auth middleware - Start:', {
      method: req.method,
      url: req.url,
      path: req.path,
      baseUrl: req.baseUrl,
      originalUrl: req.originalUrl
    });

    // Log all headers for debugging
    console.log('Headers:', JSON.stringify(req.headers, null, 2));
    
    const authHeader = req.headers.authorization;
    console.log('Auth header:', authHeader);
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('No token provided or invalid format');
      return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    console.log('Token:', token);
    
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET is not defined');
      return res.status(500).json({ message: 'Server configuration error' });
    }

    console.log('JWT_SECRET:', {
      exists: !!process.env.JWT_SECRET,
      length: process.env.JWT_SECRET.length
    });
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Decoded token:', decoded);
    
    // Set both user and userId for compatibility
    req.user = { id: decoded.userId };
    req.userId = decoded.userId;
    console.log('Set user ID:', req.userId);
    
    // Add debug response headers
    res.setHeader('X-User-ID', req.userId);
    res.setHeader('X-Debug-Auth', 'true');
    
    next();
  } catch (error) {
    console.error('Auth middleware error:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      token: req.headers.authorization ? req.headers.authorization.split(' ')[1] : undefined
    });

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }

    res.status(401).json({ message: 'Authentication failed' });
  }
}; 