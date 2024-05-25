const  User = require('../models/userModel')
const otpUser=require('../models/otpModel')
const bcrypt= require('bcrypt')
const nodemailer= require('nodemailer')
const address= require('../models/adressModel')
//const { render } = require('../routes/userRoute')
const category = require('../models/categoryModel')
require('dotenv').config();




const loadhome=async (req,res)=>{
    try {
      const catData = await category.find({})
      console.log(catData);
        if (req.session.user_id) {
          const userData = await User.findOne({_id:req.session.user_id})
          res.render('home',{users:userData,categories:catData})
          
        } else {
          res.render('home',{categories:catData})
        }
       
    } catch (error) {
      next(error);  // Pass the error to the error handling middleware
        console.log(error.message+" 20");
    }
}

const loadLogin =async (req,res)=>{
    try {
        res.render('userLogin')
    } catch (error) {
        console.log(error.message);
        next(error);  // Pass the error to the error handling middleware
    }
}

const userRegister =async(req,res)=>{
    try {
        res.render('userRegister')
    } catch (error) {
        console.log(error.message);
        next(error);  // Pass the error to the error handling middleware
    }
}

const securePassword = async (password) => {
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    return passwordHash;
  } catch (error) {
    console.log(error.message + " 10");
    next(error);  // Pass the error to the error handling middleware
  }
};

//verify mail
const sendOtpMail = async (name, email, mobile, otp) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL,
        pass: process.env.APP_CODE
      },
      secure: true, // Set secure to true for a secure connection
      requireTLS: true, // Require TLS for the connection
    });
    const mailOptions = {
      from: "importantOtp@gmail.com",
      to: email,
      subject: `Verification mail`,
      html: `<p>Hello ${name},this is your OTP: ${otp}.,mobile no:${mobile},Please do not share it with anyone.</p>`
    };

    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log(error.message + " - Error occurred while sending email."); // Print error message if sending email fails
      } else {
        console.log(`Email has been sent: ${info.response}`); // Print success message if email is sent successfully
      }
    });
  } catch (error) {
    console.log(error.message + " - Error occurred."); // Print error message if any other error occurs
    next(error);  // Pass the error to the error handling middleware
  }
}

const otpGenarator = async(mail)=>{
  try {
    const otp = Math.floor(100000 + Math.random() * 900000);
    //console.log(otp);
    const newOtp = new otpUser({
      email: mail,
      otp: otp
    });
    const otpData = await newOtp.save();
    return otpData
  } catch (error) {
    console.log(error.message);
  }
}


const insertUser = async (req, res) => {
  try {
    console.log(req.body);
    const secureUserPasswd = await securePassword(req.body.password);
    const otpData = await otpGenarator(req.body.email)
    const existingUserEmail = await User.findOne({ email: req.body.email });
    const existingUserMobile = await User.findOne({ mobile: req.body.mobile });
    if (existingUserEmail) {
      return res.render("userRegister", { message: "email is already in use" });
    }
    if (existingUserMobile) {
      return res.render("userRegister", {
        message: "mobile is already in use ",
      });
    }
    req.session.userData ={
      name: req.body.name,
      phone: req.body.mobile,
      email: req.body.email,
      password: secureUserPasswd,
    };
    //console.log(req.session.userData);
    /* */
    
    
    console.log(otpData);
    //const otpData = await newOtp.save();
    console.log(otpData);
    if (req.session.userData) {
      sendOtpMail(req.body.name,req.body.email,req.body.mobile,otpData.otp);
      res.render('otpVerify');
    } else {
      res.render("userRegister", { message: "failed to save the data" });
    }
  } catch (error) {
    console.log(error.message );
    next(error);  // Pass the error to the error handling middleware
  }
};

const loadOtp= async (req,res)=>{
    try {
        res.render('otpVerify')
    } catch (error) {
        console.log(error.message)
        next(error);  // Pass the error to the error handling middleware
    }
}

const confirmOtp = async (req, res) => {
  try {
    const sUser = req.session.userData
    console.log(sUser.email);
    savedOtp = await otpUser.findOne({email:sUser.email})
    console.log(savedOtp.otp);
    enteredOtp = req.body.otp
    console.log(enteredOtp);
    if(savedOtp.otp === enteredOtp){
      const newUser = new User({
        name: sUser.name,
        email: sUser.email,
        mobile: sUser.phone,
        password: sUser.password,
        isVerified: true,
        isAdmin:false
       
      }); 
      const userData = await newUser.save();
      res.redirect('/login')

    }else{
      res.render('otpVerify',{message:'wrong otp'})
    }
  } catch (error) {
    next(error);  // Pass the error to the error handling middleware
    console.log(error.message+"otp101");
  }
};

const resendOtp = async(req,res)=>{
  try {
    const sUser = req.session.userData
    savedOtp = await otpUser.findOne({email:sUser.email})
    if (sUser) {
      sendOtpMail(sUser.name,sUser.email,sUser.phone,savedOtp.otp);
      res.render('otpVerify',{message:"Opt resend confirmed"});
    }
  } catch (error) {
    console.log(error.message);
    next(error);  // Pass the error to the error handling middleware
  }
}



const verifyUserLogin = async (req, res) => {
  try {
    const catData = await category.find({})
    const email = req.body.email;
    const password = req.body.password;
    const loginUserData =await User.findOne({email:email})
    if (loginUserData) {
      const passwordCheck = await bcrypt.compare(
        password,
        loginUserData.password
      );
      if (passwordCheck) {
        if (loginUserData.isVerified === false) {
          res.render("otpVerify", { message: "please verify with OTP" });
        } else {
          req.session.user_id = loginUserData._id;
          res.render("home",{users:loginUserData,categories:catData});
        }
      } else {
        res.render("userLogin", { message: "login credentials are incorrect" });
      }
    } else {
      res.render("userLogin", { message: "login credentials are incorrect" });
    }
  } catch (error) {
    console.log(error.message);
    next(error);  // Pass the error to the error handling middleware
  }
};

const logout = async (req,res)=>{
  try {
    req.session.destroy()
    res.redirect("/")
} catch (error) {
    console.log(error.message);
    next(error);  // Pass the error to the error handling middleware
}
}
const userProfile = async(req,res)=>{
  try {
    const _id =req.session.user_id
    const userData= await User.findOne({_id:_id})
    //console.log(userData);
    res.render('userProfile',{users:userData})
  } catch (error) {
    console.log(error.message);
    next(error);  // Pass the error to the error handling middleware
  }
}

const loadeditUserData =async (req,res)=>{
  try {
    const _id =req.session.user_id
    const userData= await User.findOne({_id:_id})
    res.render('editUser',{users:userData})
  } catch (error) {
    console.log(error.message);
    next(error);  // Pass the error to the error handling middleware
  }
}

const saveUserData = async (req,res)=>{
  try {
    console.log(req.session)
    console.log(req.body);
    const id =req.session.user_id
    console.log(id);
    const userData= await User.findOne({_id:id})
    console.log(userData);
    //const userEmail= await otpUser.findOne({email:userData.email})
    //console.log(userEmail.otp);
    const name = req.body.name
    const email = req.body.email
    const mobile = req.body.mobile
    //console.log(name,email,mobile);
    if (userData) {
      /* sendOtpMail(req.body.name,req.body.email,req.body.mobile,userData._id,userEmail.otp);
      res.render("otpVerify", { message: "your registration is successfull" });
       */
      const updateInfo = await User.updateOne({ _id:id }, { $set: { name:name,email:email,mobile:mobile} })
    console.log(updateInfo);
    res.redirect('/profile')
    } else {
      res.render("editUser", { message: "failed to save the data" });
    }
    /* if(flag=1){
      
    const userNewData= await User.findOne({_id:_id})
    res.render('home',{users:userNewData})
    } */
  } catch (error) {
    console.log(error.message +"10010");
    next(error);  // Pass the error to the error handling middleware
  }
}


/* user Address */
const userAdress = async(req,res)=>{
  try {
    console.log(req.session);
    const addressData = await address.find({userId:req.session.user_id})
    const userData = await User.findOne({_id:req.session.user_id})
    res.render('userAddress',{users: userData ,address:addressData})
  } catch (error) {
    console.log(error.message);
    next(error);  // Pass the error to the error handling middleware
  }
}

const loadAddAddress = async(req,res)=>{
  try {
    if (req.session.user_id) {
      
      const userData = await User.findOne({_id:req.session.user_id})
      res.render('addAddress',{users:userData})
    } else {
      
    }
  } catch (error) {
    console.log(error.message);
    next(error);  // Pass the error to the error handling middleware
  }
}


const saveAddress =async(req,res)=>{
  try {
    console.log(req.body);
    if(req.session.user_id){
      const addressData = new address({
        userId:req.session.user_id,
        name:req.body.name,
        mobile:req.body.mobile,
        address:req.body.address,
        pincode:req.body.pincode,
        state:req.body.state,
        city:req.body.city,
        isDefault:false
      })
      const savedAddress= await addressData.save()
      console.log(savedAddress);
      res.redirect('/address')
    }    
  } catch (error) {
    console.log(error.message);
    next(error);  // Pass the error to the error handling middleware
  }
}

const loadEditAddress = async(req,res)=>{
  try {
    const addId =req.query._id
    if(addId){
      addressData=await address.findById({_id:addId})
      userData =await User.findById({_id:addressData.userId})
      res.render('editAddress',{users:userData,address:addressData})}
  } catch (error) {
    console.log(error.message);
    next(error);  // Pass the error to the error handling middleware
  }
}

const updateAddress =async (req,res)=>{
  try {
    const addId = req.query._id
    console.log(addId+" hits here");
    if(addId){
      addressData=await address.findById({_id:addId})
      userData =await User.findById({_id:addressData.userId})
      console.log(req.body.name+"hit user");
      console.log(addressData+"hit address"); 
      const addUp = await address.updateOne(
        { _id: addId }, // Use catId obtained from req.query._id
        {
            $set: {
              name:req.body.name,
              mobile:req.body.mobile,
              address:req.body.address,
              pincode:req.body.pincode,
              state:req.body.state,
              city:req.body.city
            }
        }
    )
    console.log(addUp);
     res.redirect('/address')
    }
  } catch (error) {
    console.log(error.message +"error here");
    next(error);  // Pass the error to the error handling middleware
  }
}
const deleteAddress = async(req,res)=>{
  try {
    const addId = req.params.id
    console.log(addId+" address id");
    const check = await address.deleteOne({_id:addId})
    console.log(check+' here 339')
    
    res.redirect('/address');


  } catch (error) {
    console.log(error.message);
    next(error);  // Pass the error to the error handling middleware
  }
}

const changePassword = async(req,res)=>{
  try {
    const _id =req.session.user_id
    const userData= await User.findOne({_id:_id})
    res.render('changePassword',{users:userData})
    
  } catch (error) {
    console.log(error.message);
    next(error);  // Pass the error to the error handling middleware
  }
}
const updatePassword = async(req,res)=>{
  try {
    console.log(req.body);
    const oldpassword = req.body.oldPassword;
    const newPassword = req.body.newPassword
    const secureUserPasswd = await securePassword(newPassword)
    const _id =req.session.user_id
    const userData= await User.findOne({_id:_id})
    console.log(userData);
    if(userData){
      const oldCheck = await bcrypt.compare(oldpassword,userData.password)
      console.log(oldCheck);
      if (oldCheck) {
        const upPass = await User.updateOne({_id:_id},{$set: {password:secureUserPasswd}})
        console.log(upPass);
        res.redirect('/profile')
      } else {
        res.render('changePassword',{users:userData,message:'old password is not correct'})        
      }
    }

  } catch (error) {
    console.log(error.message+" new password update lose");
    next(error);  // Pass the error to the error handling middleware
  }
}






module.exports={
    loadhome,
    loadLogin,
    verifyUserLogin,
    userRegister,
    insertUser,
    loadOtp,
    confirmOtp,
    resendOtp,
    logout,
    userProfile,
    loadeditUserData,
    saveUserData,
    userAdress,
    loadAddAddress,
    saveAddress,    
    loadEditAddress,
    updateAddress,
    deleteAddress,
    changePassword,
    updatePassword,


}