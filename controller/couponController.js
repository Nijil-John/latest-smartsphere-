
const loadCoupon = async(req,res)=>{
    try {
        console.log( req.session.adminData);
        res.render('adminCoupon',{admin:"adminData"} )
    } catch (error) {
        console.log(error.message);
    }
}

module.exports={
    loadCoupon,
}