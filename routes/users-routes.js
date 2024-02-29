const express = require("express");
const { check } = require("express-validator"); // library provides lots of middlewares. Check method is used to check routes.

const usersController = require("../controllers/users-controllers");
const fileUpload = require("../middleware/file-upload");

const router = express.Router();

// ---- GET array of users ----
router.get("/", usersController.getUsers);

// ---- POST create a new user ----
router.post(
  "/signup",
  fileUpload.single("image"),
  [
    check("name").not().isEmpty(),
    check("email")
      .normalizeEmail() // Test@test.com => test@test.com
      .isEmail(),
    check("password").isLength({ min: 6 }),
  ],
  usersController.signup
);

// ---- POST login data----
router.post("/login", usersController.login);

module.exports = router;
