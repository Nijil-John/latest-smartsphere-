const mongoose = require("mongoose");

const adminSchema = mongoose.Schema({
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
  DOB: {
    type: Date,
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
  createdAt: {
    type: Date,
    default: Date.now
  }
});
const Admin = mongoose.model("admin",adminSchema);
module.exports = Admin;
