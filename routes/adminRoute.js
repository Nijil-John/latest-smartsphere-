const express = require("express");
const adminRoute =express()
const session = require('express-session')
const caches= require('nocache')
/* const path =require('path') */

const config = require('../config/config')
adminRoute.use(session({
    secret:config.sessionSecret,
    resave: false,
    saveUninitialized: true 
}))


adminRoute.use(express.urlencoded({ extended: true }));//--
adminRoute.use(express.json())//--

adminRoute.use(express.static('adminAsset'))
/* adminRoute.use(express.static(path.join(__dirname,'adminAsset'))) */

adminRoute.set('view engine', 'ejs');//--
adminRoute.set("views","./views/admin");

adminRoute.use(caches())
const uploadImage = require('../middleware/upload')
const adminController = require('../controller/adminController');
const nocache = require("nocache");

adminRoute.get('/',adminController.adminLoadlogin)
adminRoute.get('/register',adminController.adminLoadregister)
adminRoute.post('/register',adminController.adminRegister)
adminRoute.post('/',adminController.adminVerifyLogin)
adminRoute.get('/adminDashboard',adminController.adminDashboard)
adminRoute.get('/logout',adminController.adminLogout)
adminRoute.get('/customer',adminController.loadCustomer)
adminRoute.get('/category',adminController.loadCategory)
adminRoute.post('/category',adminController.addCatogeries)
adminRoute.get('/editCategory',adminController.editCategory)
adminRoute.post('/editCategory',adminController.updateCategory)
adminRoute.get('/category/:id',adminController.categoryAction)


adminRoute.get('/products',adminController.loadProduct)
adminRoute.get('/addproduct',adminController.loadAddProducts)
adminRoute.post('/addproduct',uploadImage.single('productImages'),adminController.AddProducts)
adminRoute.get('/customer/:id',adminController.customerAction)

adminRoute.get('/order',adminController.orderLoad)



module.exports=adminRoute