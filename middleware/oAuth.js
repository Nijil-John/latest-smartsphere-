const passport = require('passport')
require('dotenv').config();
const GoogleStrategy = require( 'passport-google-oauth2' ).Strategy;
const User=require('../models/userModel');
//onst { logout } = require('../controller/userController');
passport.use(new GoogleStrategy({
    clientID:     process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "https://smart-sphere.shop/auth/google/callback/",
    passReqToCallback   : true
  },
  async (req,res, accessToken, refreshToken, profile, done) => {
    try {
      // Check if user already exists
      let user = await User.findOne({ email: profile.email });

      if (!user) {
        // If user doesn't exist, create a new one
        user = new User({
          googleId: profile.id,
          name: profile.displayName,
          email: profile.email,
         
        });
        await user.save(); // Save the new user to the database
        
      }
      //res.render('home', {users: user})



      // Pass the user to the next middleware
      return done(null, user);
    } catch (err) {
      return done(err, null);
    }
  }
));

passport.serializeUser((user, done) => {
    try {
        //console.log(user);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });
  
  passport.deserializeUser((user, done) => {
    try {
      done(null, user);
    } catch (error) {
      done(error);
    }
  });
  

module.exports=passport;