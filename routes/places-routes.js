const express = require("express");
const { check } = require("express-validator"); // library provides lots of middlewares. Check method is used to check routes.

const placesControllers = require("../controllers/places-controllers");
const fileUpload = require("../middleware/file-upload");
const checkAuth = require("../middleware/check-auth");

const router = express.Router();

// ---- GET place by ID ----
router.get("/:pid", placesControllers.getPlaceById);

// ---- GET places by user ID ----
router.get("/user/:uid", placesControllers.getPlacesByUserId);

// Request without a valid token will never reach the bottom roots
// because it will always be handled by this middleware.
router.use(checkAuth);

// ---- POST create place ----
router.post(
  "/",
  fileUpload.single("image"),
  [
    check("title").not().isEmpty(),
    check("description").isLength({ min: 5 }),
    check("address").not().isEmpty(),
  ],
  placesControllers.createPlace
);

// ---- PATCH update place ----
router.patch(
  "/:pid",
  [check("title").not().isEmpty(), check("description").isLength({ min: 5 })],
  placesControllers.updatePlace
);

// ---- DELETE place ----
router.delete("/:pid", placesControllers.deletePlace);

module.exports = router;
