function isloggedin(req,res,next){
    if(req.session && req.session.adminData){
        return next()
    }else{
        return res.redirect('/admin/')
    }
}
module.exports=isloggedin