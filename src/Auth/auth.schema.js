const { Schema, model } = require("mongoose");
const UserSchema = new Schema({
  email: { type: String, unique: true },
  pass: String,
  name: String,
  profilePic: {
    type: String,
    default:
      "https://firebasestorage.googleapis.com/v0/b/surtiestest2.appspot.com/o/images%2Fpng-transparent-avatar-user-computer-icons-software-developer-avatar-child-face-heroes-4180903902-removebg-preview%20(1).png?alt=media&token=9386383b-e524-45a9-8db2-ed462548d6e2",
  },
  age: Number,
  loginAttempts: {
    type: Number,
    required: true,
    default: 0,
  },
  lockUntil: {
    type: Number,
    required: true,
    default: new Date(),
  },
  block: {
    type: Boolean,
    require: true,
    default: false,
  },
  role: {
    type: String,
    enum: ["admin", "user", "newsEditor"],
    default: "user",
  },
});
const UserModel = model("user", UserSchema);
module.exports = UserModel;
