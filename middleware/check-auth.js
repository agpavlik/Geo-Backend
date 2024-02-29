const jwt = require("jsonwebtoken");

const HttpError = require("../models/http-error");

module.exports = (req, res, next) => {
  // Browser automatically sends a 'OPTIONS' request before it sends
  // the actual request. Threfore, we check if it is "OPTIONS" and
  // will return next and allow this request to continue.
  if (req.method === "OPTIONS") {
    return next();
  }
  // Check if we have a valid token
  try {
    const token = req.headers.authorization.split(" ")[1]; // Authorization: 'Bearer TOKEN'
    if (!token) {
      throw new Error("Authentication failed!");
    }
    // Validate token
    const decodedToken = jwt.verify(token, "supersecret_dont_share");
    // If token is valid, request continue with added data.
    req.userData = { userId: decodedToken.userId };
    next();
  } catch (err) {
    const error = new HttpError("Authentication failed!", 401);
    return next(error);
  }
};
