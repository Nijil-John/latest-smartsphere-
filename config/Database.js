const mongoose=require('mongoose')

const connectDb = async()=>{
    try {
        mongoose.connect("mongodb+srv://nijiljohn0804:M1r5DrxqtnTEonMo@cluster1.ztd58.mongodb.net/smartsphere")
    } catch (error) {
        console.log("error in db connection "+error.message);
    }
}
module.exports={ connectDb}