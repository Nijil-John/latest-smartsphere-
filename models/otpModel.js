const mongoose = require("mongoose");

const userOTP = mongoose.Schema({
    email:String,
    otp:String,

    //expire
    createdAt: {
        type: Date,
        default:Date.now
      }
})
const otpUser = mongoose.model("userotp",userOTP);
module.exports = otpUser;