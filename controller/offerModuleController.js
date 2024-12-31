const offer = require("../models/offerModel");
const product = require("../models/productModel");
const category = require("../models/categoryModel");
const cron = require("node-cron");
const user = require('../models/userModel')
const cart= require('../models/cartModel')
const wishlist = require('../models/wishlistModel')



const loadadminOfferModule = async (req, res) => {
    try {
        adminData = req.session.adminData;
        const offerData = await offer.find();
        //console.log(adminData);
        res.render("adminOfferModule", { admin: adminData, offer: offerData });
    } catch (error) {
        console.log(error.message);
    }
};
const productOffer = async (req, res) => {
    try {
        const productData = await product.find();
        const categoryData = await category.find();
        res.render("adminAddOffer", {
            admin: "adminData",
            category: categoryData,
            product: productData,
        });
    } catch (error) {
        console.log(error.message);
    }
};

const addOffer = async (req, res) => {
    try {
        let { title, TypeId, offerType, discountPercentage, startDate, endDate } =
            req.body;
        if (offerType === "product") {
            TypeId = TypeId[0];
        } else {
            TypeId = TypeId[1];
        }

        const OfferAdd = new offer({
            title: title,
            offerType: offerType,
            typeId: TypeId,
            discountPercentage: discountPercentage,
            startDate: startDate,
            endDate: endDate,
            status: "pending",
        });
        let save = await OfferAdd.save();
        res.redirect("/admin/offer");
    } catch (error) {
        console.log(error.message);
        res.status(500).send("Server Error");
    }
};

const updateOffer = async (req, res) => {
    try {
        adminData = req.session.adminData;
        const offerData = await offer.findById(req.query._id);
        const productData = await product.find();
        const categoryData = await category.find();
        console.log(req.body);

        if (req.body.offerId) {
            let {
                offerId,
                title,
                offerType,
                TypeId,
                discountPercentage,
                startDate,
                endDate,
            } = req.body;
            let updatedOffer = await offer.updateOne(
                { _id: offerId },
                {
                    $set: {
                        title: title,
                        typeId: TypeId,
                        discountPercentage: discountPercentage,
                        startDate: startDate,
                        endDate: endDate,
                        status: "pending",
                    },
                }
            );
            console.log(updatedOffer);
            return res.redirect("/admin/offer");
        }

        res.render("editOffer", {
            admin: adminData,
            category: categoryData,
            product: productData,
            offer: offerData,
        });
    } catch (error) {
        console.log(error.message);
    }
};

const applyingOffer = async () => {
  try {
    const offers = await offer.find({ status: { $nin: ["expired","activated"] },$expr: { $gte: [new Date(), "$startDate"]} });//status: "active",
    //console.log(offers+`from applying offer`);
    if (offers.length !== 0) {
      for (const offerValue of offers) {
        if (offerValue.offerType === "product") {
          // Handle product-specific offers
          const productData = await product.findOne({
            productId: offerValue.typeId,
          });
          console.log(productData);
          if (productData) {
            const offerDeduction = (
              (productData.originalPrice * offerValue.discountPercentage) /
              100
            ).toFixed();
            let priceNeedToUpdate = productData.originalPrice - offerDeduction;
            await product.updateOne(
              { productId: offerValue.typeId },
              { $set: { price: priceNeedToUpdate } }
            );
          }
        } else if (offerValue.offerType === "category") {
          // Handle category-specific offers
          const catData = await category.findOne({ categoryId: offerValue.typeId });
          //console.log(catData);
          if (catData) {
            const products = await product.find({ categoryId: catData._id });
            //console.log(products);
            for (const item of products) {
              const offerDeduction = (
                (item.originalPrice * offerValue.discountPercentage) /
                100
              ).toFixed();
              const priceNeedToUpdate = item.originalPrice - offerDeduction;

              let upProduct = await product.updateOne(
                { _id: item._id },
                { $set: { price: priceNeedToUpdate } }
              );
              console.log(
                item._id + ",price going to update" + priceNeedToUpdate
              );

              console.log(upProduct);
            }
          }
        }
        let offerUp = await offer.updateMany(
          { _id: offerValue._id },
          { $set: { status: "activated" } }
        );
        console.log(offerUp + "from here2");
      }
      
    }
    //console.log("Offers applied successfully");
  } catch (error) {
    console.error("Error applying offers:", error.message);
  }
};

const reverseOffers = async () => {
  try {
    const now = new Date();
    const deletedOffers = await offer.find({status: { $nin: ["expired"] }, $expr: { $gte: [now, "$endDate"] } });
    //console.log(deletedOffers.length);
    if (deletedOffers.length !== 0) {
      for (const offerValue of deletedOffers) {
        console.log(offerValue);
        if (offerValue.offerType === "product") {
          const productData = await product.findOne({ productId: offerValue.typeId });
          if (productData) {
            await product.updateOne(
              { productId: offerValue.typeId },
              { $set: { price: productData.originalPrice } }
            );
          }
        } else if (offerValue.offerType === "category") {
          const catData = await category.find({ categoryId: offerValue.typeId });
          if (catData && catData.length > 0) {
            const products = await product.find({ categoryId: catData[0]._id });
            for (const item of products) {
              await product.updateOne(
                { _id: item._id },
                { $set: { price: item.originalPrice } }
              );
            }
          }
        }

        // Update offer status
        const updatedOffer = await offer.updateOne(
          { _id: offerValue._id },
          { $set: { status: "expired" } }
        );
        console.log("Offer update result:", updatedOffer);
      }
    }
  } catch (error) {
    console.error("Error reversing offers:", error);
  }
};


// Schedule the cron job to run at a specific interval
// For example, run every day at midnight
const implementOffer = async (req, res) => {
  try {
    cron.schedule("* * * * *", async () => {
      console.log("Running cron job...");
     // await cronOfferStart();
      await applyingOffer();
      await reverseOffers();
    });
  } catch (error) {
    console.log(error.message);
  }
};

const userSideOffer= async(req,res)=>{
  try {
    console.log('it reached here');
    //console.log(req.session.user_id)
    const catData = await category.find()
    const userData =await user.findById(req.session.user_id)
    const offerData =await offer.find({status:"activated"})

    let productData = offerData.filter((offer) => offer.offerType === 'product');
    const categoryData = offerData.filter((offer) => offer.offerType === 'category');

    console.log(categoryData);
    // Initialize dataProduct as an array
    let dataProduct = [];

    for (let i = 0; i < productData.length; i++) {
      let productValue = await product.find({ productId: productData[i].typeId });
      
      // Push a new object to the dataProduct array
      
      dataProduct.push({
        offer: productData[i],
        productValue:productValue       
      })
    }

  /*  for(let i=0;i<dataProduct.length;i++){
    console.log(dataProduct[i]);
   } */





    if(!userData){
      res.render('offerPage',{categories: catData,offerProduct:dataProduct,offerCat:categoryData})
      }
   
    const wishLength=await wishlist.countDocuments({userId:req.session.user_id})
    let cartData = await cart.find({userId:req.session.user_id})
    
let cartCount = 0; // Default cart count

if (cartData.length > 0 && cartData[0].items) {
    let cartItem = cartData[0].items;
    cartCount = cartItem.length;
}
    



    res.render('offerPage',{wishlist:wishLength,Cart:cartCount,users:userData ,categories: catData,offerProduct: dataProduct,offerCat:categoryData})
  } catch (error) {
    console.log(error.message)
  }
}












module.exports = {
    loadadminOfferModule,
    productOffer,
    addOffer,
    updateOffer,
    implementOffer,
    userSideOffer
};
