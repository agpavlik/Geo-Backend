const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator"); // third party package to make sure we have a unique user email

const Schema = mongoose.Schema;

const userSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true, minlength: 6 },
  image: { type: String, required: true },
  places: [{ type: mongoose.Types.ObjectId, required: true, ref: "Place" }],
  // an array means that User can have multyple places
});

userSchema.plugin(uniqueValidator); // query email as fast as possible in database with unique

module.exports = mongoose.model("User", userSchema);
