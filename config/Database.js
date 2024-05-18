const mongoose=require('mongoose')

const connectDb = async()=>{
    try {
        mongoose.connect("mongodb://127.0.0.1:27017/eCommerce")
    } catch (error) {
        console.log("error in db connection "+error.message);
    }
}
module.exports={ connectDb}