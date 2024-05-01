const mongoose = require("mongoose");

const userSchema = mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  mobile: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  isVerified: {
    type: Boolean,
    default: 1,
  },
  isAdmin: {
    type: Boolean,
    default: 1,
  },
  blocked:{
    type:Number
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});
const User = mongoose.model("user",userSchema);
module.exports = User;
