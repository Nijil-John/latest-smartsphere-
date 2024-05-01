const express = require('express')
const userRoute = express()
const session = require('express-session')
const nocache =require('nocache')


userRoute.use(express.urlencoded({ extended: true }));
userRoute.use(express.json())

const config = require('../config/config')
userRoute.use(session({
    secret:config.sessionSecret,
    resave: false,
    saveUninitialized: true 
}))


userRoute.set('view engine', 'ejs');
userRoute.set("views","./views/user");

userRoute.use(nocache())

const userController = require('../controller/userController')

userRoute.get('/',userController.loadhome)
userRoute.get('/login',userController.loadLogin)
userRoute.post('/login',userController.verifyUserLogin)
userRoute.get('/userRegister',userController.userRegister)
userRoute.post('/userRegister',userController.insertUser)
userRoute.get('/otp',userController.loadOtp)
userRoute.post('/otp',userController.confirmOtp)
userRoute.get('/profile',userController.userProfile)
userRoute.get('/edit',userController.loadeditUserData)
userRoute.post('/edit',userController.saveUserData)



userRoute.get('/logout',userController.logout)




module.exports=userRoute