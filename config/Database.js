const mongoose=require('mongoose')
require("dotenv").config();


const connectDb = async()=>{
    try {
        mongoose.connect(process.env.MONGODB)
    } catch (error) {
        console.log("error in db connection "+error.message);
    }
}
module.exports={ connectDb}