const Banner = require('../models/bannerModel')

const loadBanners= async(req,res)=>{
    try {
        adminData =req.session.adminData
        console.log(adminData);
        res.render('adminBanner',{admin:adminData})
    } catch (error) {
        console.log(error.message);
    }
}


module.exports = {
    loadBanners,
}