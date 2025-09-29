const jwt = require("jsonwebtoken");
const socketServer = require("../socketServer");

module.exports = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "No token provided" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    
    // Mark user as online when they make authenticated requests
    socketServer.markUserOnline(decoded.userId);
    
    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid token" });
  }
};
