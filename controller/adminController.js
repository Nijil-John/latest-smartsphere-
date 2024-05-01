const admin = require('../models/adminModel')

const adminLoadlogin = async(req,res)=>{
    try {
        res.render('adminLogin')
    } catch (error) {
        console.log(error.message);
    }
}



module.exports={
    adminLoadlogin,
}