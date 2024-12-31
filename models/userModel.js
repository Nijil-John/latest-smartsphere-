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
    type: String
  },
  password: {
    type: String
  },
  isVerified: {
    type: Boolean,
    default: 1,
  },
  googleId: {
    type: String    
  }
  ,
  isAdmin: {
    type: Boolean,
    default: 1,
  },
  blocked:{
    type:Boolean,
    default:0
  }, 
  createdAt: {
    type: Date,
    default: Date.now
  }
});
const User = mongoose.model("user",userSchema);
module.exports = User;
