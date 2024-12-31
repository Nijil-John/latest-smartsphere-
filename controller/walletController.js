const wallet = require("../models/walletModel");
const User = require("../models/userModel");
const wishlist = require("../models/wishlistModel");
const cart = require("../models/cartModel");
const category = require("../models/categoryModel");

const loadWallet = async (req, res) => {
  try {
    let userData = await User.findOne({ _id: req.session.user_id });
    let walletData = await wallet.findOne({ userId: req.session.user_id });
    if (!walletData) {
      walletData = new wallet({
        userId: req.session.user_id,
        balance: 0,
        /* history: [{ amount: 0, type: "credit",reason:"Wallet initialization" }], */
      });
      await walletData.save();
    }
    console.log(walletData);
   
    res.render("userWallet", { users: userData, wallet: walletData });
  } catch (error) {
    console.log(error.message);
  }
};
 const loadTransaction =async(req,res)=>{
  try {
    
    let userData = await User.findOne({ _id: req.session.user_id });
    let walletData = await wallet.findOne({ userId: req.session.user_id });
    transaction=walletData.history
    console.log(transaction);
    res.render('userWalletTransaction',{ users: userData,transaction,walletData })
  } catch (error) {
    console.log(error.message);
  }
 }

module.exports = {
  loadWallet,
  loadTransaction,
};
