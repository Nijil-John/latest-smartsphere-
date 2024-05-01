const express = require("express");
const adminRoute =express()


adminRoute.set('view engine', 'ejs');
adminRoute.set("views","./views/admin");


const adminController = require('../controller/adminController')
adminRoute.get('/',adminController.adminLoadlogin)




module.exports=adminRoute