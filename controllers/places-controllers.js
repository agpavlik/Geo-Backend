const fs = require("fs");

const uuid = require("uuid"); // random numbers generator
const { validationResult } = require("express-validator");
const mongoose = require("mongoose");

const getCoordsForAddress = require("../util/location");
const HttpError = require("../models/http-error");
const Place = require("../models/place");
const User = require("../models/user");

// First error in routes occurred if request has any problem
// Second error occured if there is no place with such id

// ---- GET place by ID --------------------------------------------------
const getPlaceById = async (req, res, next) => {
  const placeId = req.params.pid; // { pid: 'p1' }

  let place;
  try {
    place = await Place.findById(placeId); // findById - Mongoose method
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not find a place.",
      500
    );
    return next(error);
  }

  if (!place) {
    const error = HttpError("Could not find a place for the provided id.", 404);
    return next(error);
  }

  // Turn Mongoose object into a normal JavaScript object
  // and get rid off underscore in Mongoose id
  res.json({ place: place.toObject({ getters: true }) });
};
// -----------------------------------------------------------------------

// ---- GET places by user ID --------------------------------------------
const getPlacesByUserId = async (req, res, next) => {
  const userId = req.params.uid;

  let places;
  try {
    places = await Place.find({ creator: userId });
  } catch (err) {
    const error = new HttpError(
      "Fetching places failed, please try again later",
      500
    );
    return next(error);
  }

  if (!places || places.length === 0) {
    return next(
      new HttpError("Could not find places for the provided user id.", 404)
    );
  }

  res.json({
    places: places.map((place) => place.toObject({ getters: true })),
  });
};
// -------------------------------------------------------------------------

// ---- POST create place --------------------------------------------------
const createPlace = async (req, res, next) => {
  const errors = validationResult(req); // It looks into request object and see if
  // there are any validation errors.
  if (!errors.isEmpty()) {
    return next(
      new HttpError("Invalid inputs passed, please check your data.", 422)
    );
  }

  const { title, description, address } = req.body;

  // Convert address to coordinates
  let coordinates;
  try {
    coordinates = await getCoordsForAddress(address);
  } catch (error) {
    return next(error);
  }

  // New place
  const createdPlace = new Place({
    title,
    description,
    address,
    location: coordinates,
    image: req.file.path,
    creator: req.userData.userId,
  });

  // Check if user exist in database
  let user;
  try {
    user = await User.findById(req.userData.userId); // access the property of users and check whether the ID of logged user is already stored in here.
  } catch (err) {
    const error = new HttpError("Creating place failed, please try again", 500);
    return next(error);
  }

  if (!user) {
    const error = new HttpError("Could not find user for provided id", 404);
    return next(error);
  }

  console.log(user);

  // Create a new place and add place id to the corresponding user
  try {
    // Transaction allows to perform multiple operations in isolation of each other
    // To work with transactions, first - start a session, then initiate the transaction
    // and once the transaction is successful, the session is finished and the transactions are committed.
    // If anything would have gone wrong in the tasks that are part of the session and transaction,
    // all changes would have been rolled back automatically by MongoDB.
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await createdPlace.save({ session: sess }); // store the place
    user.places.push(createdPlace); // add place to user
    await user.save({ session: sess }); // save updated user
    await sess.commitTransaction();
  } catch (err) {
    const error = new HttpError(
      "Creating place failed, please try again.",
      500
    );
    return next(error); // stop code execution in case an error
  }

  res.status(201).json({ place: createdPlace });
};

// --------------------------------------------------------------------------

// ---- PATCH update place --------------------------------------------------
const updatePlace = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError("Invalid inputs passed, please check your data.", 422)
    );
  }

  const { title, description } = req.body;
  const placeId = req.params.pid;

  let place;
  try {
    place = await Place.findById(placeId);
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not update place.",
      500
    );
    return next(error);
  }

  // Check creator
  if (place.creator.toString() !== req.userData.userId) {
    const error = new HttpError("You are not allowed to edit this place.", 401);
    return next(error);
  }

  place.title = title;
  place.description = description;

  try {
    await place.save();
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not update place.",
      500
    );
    return next(error);
  }

  res.status(200).json({ place: place.toObject({ getters: true }) });
};

// ---------------------------------------------------------------------------

// ---- DELETE place ---------------------------------------------------------
const deletePlace = async (req, res, next) => {
  const placeId = req.params.pid;

  // Populate method allows to access to a user where information should be changed
  // This method works only if there is a relation between documents
  let place;
  try {
    place = await Place.findById(placeId).populate("creator");
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not delete place.",
      500
    );
    return next(error);
  }

  // Check if place id exists
  if (!place) {
    const error = new HttpError("Could not find place for this id.", 404);
    return next(error);
  }

  // Check creator
  if (place.creator.id !== req.userData.userId) {
    const error = new HttpError(
      "You are not allowed to delete this place.",
      401
    );
    return next(error);
  }

  const imagePath = place.image;

  // If place deleted than its id also should be removed from user
  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await place.deleteOne({ session: sess }); // delete place
    place.creator.places.pull(place); // remove place id from user
    await place.creator.save({ session: sess }); // save updated user
    await sess.commitTransaction();
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not delete place.",
      500
    );
    return next(error);
  }

  // Delete image
  fs.unlink(imagePath, (err) => {
    console.log(err);
  });

  res.status(200).json({ message: "Deleted place." });
};

// ----------------------------------------------------------------------------

exports.getPlaceById = getPlaceById;
exports.getPlacesByUserId = getPlacesByUserId;
exports.createPlace = createPlace;
exports.updatePlace = updatePlace;
exports.deletePlace = deletePlace;
