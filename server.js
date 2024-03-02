// fs allows to interact with files and file system and it allows to,
// for example, delete files.
const fs = require("fs");
const path = require("path");

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");

const placesRoutes = require("./routes/places-routes");
const usersRoutes = require("./routes/users-routes");
const HttpError = require("./models/http-error");

const server = express();

server.use(bodyParser.json()); // get data out of the body.
// This will parse any incoming requests body and extract any JSON data
// which is in there, convert it to regular Javascript data structures
// and then call `next` automatically.

// Filter for requsts starts with '/uploads/images'. Static method return a file.
server.use("/uploads/images", express.static(path.join("uploads", "images")));

// ---- Handle with CORS ----
server.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE");

  next();
});
// ---------------------------

server.use("/api/places", placesRoutes);
server.use("/api/users", usersRoutes);

// Handling all requests comes after routes.
// It will be reached if some request did not get a responce before
server.use((req, res, next) => {
  const error = new HttpError("Could not find this route.", 404);
  throw error;
});

// Default error handler
server.use((error, req, res, next) => {
  // check if we do have a file and we want
  // to delete it because we had an error.
  if (req.file) {
    // delete file
    fs.unlink(req.file.path, (err) => {
      console.log(err);
    });
  }
  // check if a response has already been sent,
  // and in this case return next and forward the error
  if (res.headerSent) {
    return next(error);
  }
  res.status(error.code || 500);
  res.json({ message: error.message || "An unknown error occurred!" });
});

// Establish the connection to the database. If successful than start the back end server.
mongoose
  .connect(
    `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.3cmdq6d.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`
  )
  .then(() => {
    server.listen(5000);
  })
  .catch((err) => {
    console.log(err);
  });
