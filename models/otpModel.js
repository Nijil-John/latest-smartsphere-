const mongoose = require("mongoose");

const userOTP = mongoose.Schema({
    email:String,
    otp:String,

    //expire
    createdAt: {
        type: Date,
        default:Date.now,
        expires:60
      }
})
const otpUser = mongoose.model("userotp",userOTP);
module.exports = otpUser;