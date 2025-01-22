const admin = require("../models/adminModel");
const bcrypt = require("bcryptjs");
const user = require("../models/userModel");
const category = require("../models/categoryModel");
const product = require("../models/productModel");
const path = require("path");
const order = require("../models/orderModel");
const address = require("../models/adressModel");
const { Query } = require("mongoose");
const Order = require("../models/orderModel");
const coupon = require("../models/couponModel");
const proRetrun = require("../models/returnModel");
const PDFDocument = require("pdfkit");
const fs = require("fs");
const wallet = require("../models/walletModel");
const ExcelJS = require('exceljs')

/* admin settings */
const adminLoadlogin = async (req, res) => {
  try {
    res.render("adminLogin");
  } catch (error) {
    console.log(error.message);
  }
};
const adminLoadregister = async (req, res) => {
  try {
    res.render("adminRegister");
  } catch (error) {
    console.log(error.message);
  }
};
const securepassword = async (password) => {
  try {
    const passwordHashed = await bcrypt.hash(password, 10);
    return passwordHashed;
  } catch (error) {
    console.log(error.message);
  }
};
const adminRegister = async (req, res) => {
  try {
    console.log(req.body.DOB);
    const securedPassword = await securepassword(req.body.password);

    const existingEmail = await admin.findOne({ email: req.body.email });
    const existingMobile = await admin.findOne({ email: req.body.mobile });

    if (existingEmail) {
      return res.render("adminRegister", {
        message: "Email is already in use!",
      });
    }
    if (existingMobile) {
      return res.render("adminRegister", {
        message: "Mobile is already in use!",
      });
    }
    const newAdmin = new admin({
      name: req.body.name,
      email: req.body.email,
      mobile: req.body.mobile,
      DOB: req.body.DOB,
      password: securedPassword,
      isAdmin: true,
      isVerified: true,
      blocked: false,
    });
    console.log(newAdmin);

    const adminData = await newAdmin.save();
    if (adminData) {
      res.redirect("/adminDashboard", {
        message: "Your registration was successful!",
      });
    } else {
      res.render("adminRegister", { message: "Your registration failed!" });
    }
  } catch (error) {
    console.log(error.message + " admin insert");
  }
};
const adminVerifyLogin = async (req, res) => {
  try {
    console.log(req.body);
    const email = req.body.email;
    const password = req.body.password;
    const loginData = await admin.findOne({ email: email });
    if (loginData) {
      const passwordCheck = await bcrypt.compare(password, loginData.password);
      if (passwordCheck) {
        if (loginData.isAdmin === false) {
          res.render("adminLogin", { message: "please verify your mail" });
        } else {
          console.log(loginData._id);
          req.session.adminData = loginData;
          res.redirect("adminDashboard");
        }
      } else {
        res.render("adminLogin", { message: "Password incorrect" });
      }
    } else {
      res.render("adminLogin", { message: "Email dose'nt exist" });
    }
  } catch (error) {
    console.log(error.message + " verifylogin");
  }
};








const adminDashboard = async (req, res) => {
  try {
    const adminData = req.session.adminData;
    const filter = req.query.filter || 'daily'; // Default to 'monthly'

    let topProduct= await product.aggregate([{ $sort: { salesCount: -1 }  // Sort in descending order based on salesCount
      }, { $limit: 10 } // Limit to top 10 products
       ])
    //console.log(topProduct);
    // Fetch all orders (no status filter initially)
    const orders = await Order.find({}); // Fetching all orders, no status filtering

    const orderCounts = {
      pending: [],
      confirmed: [],
      shipped: [],
      delivered: [],
      cancelled: [],
      'Return-Requested': [],
      'Return-Approved': []
    };

    const labels = [];

    // Group orders by status and selected filter (daily, monthly, yearly)
    const ordersGroupedByDateAndStatus = orders.reduce((acc, order) => {
      let dateKey;

      // Adjust date key based on the selected filter
      if (filter === 'daily') {
        dateKey = order.createdAt.toISOString().split('T')[0]; // Date in YYYY-MM-DD format
      } else if (filter === 'monthly') {
        dateKey = order.createdAt.toISOString().split('T')[0].slice(0, 7); // Month in YYYY-MM format
      } else if (filter === 'yearly') {
        dateKey = order.createdAt.toISOString().split('T')[0].slice(0, 4); // Year in YYYY format
      }

      // Initialize the dateKey in the accumulator if it doesn't exist
      if (!acc[dateKey]) {
        acc[dateKey] = {
          pending: 0,
          confirmed: 0,
          shipped: 0,
          delivered: 0,
          cancelled: 0,
          'Return-Requested': 0,
          'Return-Approved': 0
        };
      }

      // Increment the count for the corresponding status
      acc[dateKey][order.status] = (acc[dateKey][order.status] || 0) + 1;
      return acc;
    }, {});

    // Prepare the labels and counts for the chart
    for (const date in ordersGroupedByDateAndStatus) {
      labels.push(date);
      for (const status in orderCounts) {
        orderCounts[status].push(ordersGroupedByDateAndStatus[date][status]);
      }
    }

    const TpBrand=await getTopBrands()
    console.log(TpBrand);
    const TpCategory=await getTopCategories()
   // console.log(TpCategory);
    // Pass the data to the EJS template
    res.render('adminDashboard', {
      admin: adminData,
      labels: labels,
      orderCounts: orderCounts,
      filter: filter,
      topProduct:topProduct,
      topBrands:TpBrand,
      topCategories:TpCategory
    });
  } catch (error) {
    console.log(error.message);
  }
};

const getTopBrands = async () => {
  try {
    const topBrands = await product.aggregate([
      {
        $group: {
          _id: "$brand", // Group by brand
          totalSales: { $sum: "$salesCount" }, // Sum the salesCount
          brandImage: { $first: "$productImage.path" } // Optionally include an image from the first product
        }
      },
      { $sort: { totalSales: -1 } }, // Sort by totalSales in descending order
      { $limit: 5 } // Limit to top 10 brands
    ]);
    return topBrands;
  } catch (error) {
    console.error("Error fetching top brands:", error);
  }
};
const getTopCategories = async () => {
  try {
    const topCategories = await product.aggregate([
      {
        $lookup: {
          from: "categories", // Collection name for categories
          localField: "categoryId",
          foreignField: "_id", // Match with the MongoDB default _id
          as: "categoryDetails"
        }
      },
      { $unwind: "$categoryDetails" }, // Flatten the populated array
      {
        $group: {
          _id: "$categoryDetails.categoryName", // Group by category name
          totalSales: { $sum: "$salesCount" }, // Sum the salesCount
          categoryImage: { $first: "$productImage.path" } // Optionally include an image
        }
      },
      { $sort: { totalSales: -1 } }, // Sort by totalSales in descending order
      { $limit: 5 } // Limit to top 10 categories
    ]);
    return topCategories;
  } catch (error) {
    console.error("Error fetching top categories:", error);
  }
};











const adminLogout = async (req, res) => {
  try {
    req.session.destroy();
    res.redirect("/admin/");
    console.log(req.session);
  } catch (error) {
    console.log(error.message);
  }
};
/* customer settings */
/* const loadCustomer = async (req,res)=>{
    try {
        if(req.session){
            var search = "";
    if (req.query.search) {
      search = req.query.search;
    }

            const userDatas = await user.find({
                isAdmin: false,
                $or: [
                  { name: { $regex: ".*" + search + ".*", $options: "i" } },
                  { email: { $regex: ".*" + search + ".*", $options: "i" } },
                  { mobile: { $regex: ".*" + search + ".*", $options: "i" } },
                ],
              });
            res.render('adminCustomer',{admin:req.session,user:userDatas})
        }
    } catch (error) {
        console.log(error.message+" customer")
    }
} */

const loadCustomer = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  try {
    const users = await user.find().skip(skip).limit(limit);
    const userCount = await user.countDocuments();

    if (skip >= userCount) {
      return res.status(404).send("Page not found");
    }

    res.render("adminCustomer", {
      user: users,
      admin: req.session.adminData,
      page,
      totalPages: Math.ceil(userCount / limit),
      limit,
    });
    console.log(req.session);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* block /unblock the customer */
const customerAction = async (req, res) => {
  try {
    const userId = req.params.id;
    const userData = await user.findOne({ _id: userId });
    if (userId) {
      if (userData.blocked === false) {
        const block = await user.updateOne(
          { _id: userId },
          { $set: { blocked: true } }
        );

        console.log(block + "its blocked");
      } else {
        const unblock = await user.updateOne(
          { _id: userId },
          { $set: { blocked: false } }
        );
        console.log(unblock + "its unblocked");
      }
    }
  } catch (error) {
    console.log(error.message + " its here");
  }
};

/* order settings */
const orderLoad = async (req, res) => {
  try {
    // Pagination setup
    const page = parseInt(req.query.page) || 1; // Current page number, default to 1
    const limit = parseInt(req.query.limit) || 30; // Number of orders per page, default to 10
    const skip = (page - 1) * limit;

    // Fetch orders from the database with pagination
    let orderData = await order.find({ status: { $ne: "delivered" } }).skip(skip).limit(limit); /* .lean(); */ // Convert documents to plain JavaScript objects for EJS rendering
    let productArray = [];
    let addressArray = [];
    for (let i = 0; i < orderData.length; i++) {
      productArray[i] = orderData[i].items;
      addressArray[i] = orderData[i].address;
    }
    //console.log(productArray,addressArray);

    let proData = [];
    let addressData = await address.findById(addressArray[0].shippingAddress);
    for (let i = 0; i < productArray.length; i++) {
      proData[i] = await product.findById(productArray[i].productId);
    }
    orderData.reverse();

    // Get the total count of orders for pagination purposes
    const totalOrders = await order.countDocuments();
    const totalPages = Math.ceil(totalOrders / limit);
    //console.log(orders);

    // Render the order page template with fetched data
    res.render("adminOrder", {
      admin: req.session.adminData,
      orders: orderData,
      page,
      totalPages,
      limit /* userData: */,
    });
  } catch (error) {
    console.log(error.message);
  }
};
const orderDetail = async (req, res) => {
  try {
    const orderData = await Order.find({ _id: req.query.orderId });
    const couponData = await coupon.findById(orderData[0].couponId);
    let productArray = orderData[0].items;
    let addressArray = orderData[0].address;
    let userData = await user.find({ _id: orderData[0].userId });
    let returnProduct = await proRetrun.find({ orderId: req.query.orderId });
    // console.log("return Data :"+returnProduct);
    let proData = [];
    let addressData = await address.findById(addressArray[0].shippingAddress);
    for (let i = 0; i < productArray.length; i++) {
      proData[i] = await product.findById(productArray[i].productId);
      // Extract the quantity from productArray
      const ql = productArray[i].quantity;
      let qs=productArray[i].returnStatus;
    
      // Log the product details before modification
      console.log(proData[i]);
    
      // Check if the product data exists and add the 'orderQuantity' field
      if (1===1) {
        proData[i].quantity = ql; // Assign the actual quantity value
        proData[i].brand  =qs
      } else {
        console.log(`Product with ID  not found.`);
      }
    
      // Log the modified product details
      console.log(proData);
    }
    //console.log(productArray);
    //console.log(orderData);

    res.render("adminOrderDetails", {
      admin: req.session.adminData,
      products: proData,
      quantity: productArray,
      order: orderData[0],
      address: addressData,
      user: userData,
      coupon: couponData,
      returnData: returnProduct,
    });
  } catch (error) {
    console.log(error.message);
  }
};

const orderUpdate = async (req, res) => {
  try {
    //console.log("here the value here");
    //console.log(req.body);
    let {
      orderId,
      orderStatus,
      deliveryStatus,
      paymentStatus,
      returns,
      returnStatus,
      returnPaymentStatus,
    } = req.body;

    let orderUpdate;
    let returnCancelUpdate;
    let returnUpdate;

    //if the order status not return
    if ( ["pending", "confirmed", "shipped", "delivered", "cancelled"].includes( orderStatus ) ) {
      if(orderStatus =='cancelled'){
        let DataOrder = await Order.findById(orderId);
        let productOrder=DataOrder.items
        let productData=[]
  
        for(let i=0;i<productOrder.length;i++){
          productData[i]=await product.updateOne({_id:productOrder[i].productId},{$inc:{quantity:productOrder[i].quantity,salesCount:-1 }})
        }
  
      }
      let DataOrders = await Order.findById(orderId);
      //console.log(" its here not from return");

      //console.log("payment" + paymentStatus);
      if (paymentStatus) {
        orderUpdate = await Order.updateOne(
          { _id: orderId },
          { status: deliveryStatus, paymentStatus: paymentStatus }
        );
      } else {
        orderUpdate = await Order.updateOne(
          { _id: orderId },
          { status: deliveryStatus, paymentStatus: paymentStatus }
        );
      }
      //console.log(orderUpdate);
    }
    //console.log(returns);
    
    //if the order status not return
    if (returns === "true") {
      let DataOrder = await Order.findById(orderId);
      let productOrder=DataOrder.items
      let productData=[]
      //console.log(`${DataOrder} here`);
      console.log('checking from here')
      console.log(productOrder);
      if (returnStatus == "approved") {
        orderUpdate = await Order.updateOne({ _id: orderId },{ status: "Return-Approved", paymentStatus: returnPaymentStatus });
        for( let i=0;i<productOrder.length;i++){
          if(productOrder[i].returnStatus === 'Return-Requested' ){
          const result = await Order.updateOne( { _id: orderId, "items.productId": productOrder[i].productId },
            { $set: { "items.$.returnStatus": returnStatus } }
          );
          walletUpdate = await wallet.updateOne({ userId: DataOrder.userId },{$inc: { balance: productOrder[i].price },$push:
            {history: {amount:productOrder[i].price,type: "credit",reason: `${DataOrder._id} this order is returned as users request and product ${productOrder[i].productName}`}}});
        }
        }

        for( let i=0;i<productOrder.length;i++){
          if(productOrder[i].returnStatus === 'not-requested' ){
            oUpdate = await Order.updateOne(
              { _id: orderId },
              { status: "Partial Returned", paymentStatus: "paid" }
            );
        }
        }
       

        returnUpdate = await proRetrun.updateOne({ orderId: orderId },{ returnStatus: returnStatus, paymentStatus: returnPaymentStatus });
        for(let i=0;i<productOrder.length;i++){
          productData[i]=await product.updateOne({_id:productOrder[i].productId},{$inc:{quantity:productOrder[i].quantity}})
        }
      } else {
        orderUpdate = await Order.updateOne(
          { _id: orderId },
          { status: "delivered", paymentStatus: "paid" }
        );
        returnCancelUpdate = await proRetrun.deleteOne({ orderId: orderId });
      }

      //console.log("return update :"+returnUpdate);
    }

    res.redirect(`/admin/orderValues?orderId=${orderId}`);
  } catch (error) {
    console.log(error.message);
  }
};


const salesreport = async (req, res) => {
  try {
    const adminData = req.session.adminData;

    // Get the start and end date from the query parameters
    const { startDate, endDate } = req.query;

    // Build the filter object for date range if dates are provided
    let dateFilter = {};
    if (startDate) {
      dateFilter["createdAt"] = { $gte: new Date(startDate) };
    }
    if (endDate) {
      dateFilter["createdAt"] = {
        ...dateFilter["createdAt"],
        $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999)),
      };
    }

    // Fetch totalAmount within the date range
    const result = await order.aggregate([
      { $match: { status: "delivered", ...dateFilter } },
      { $group: { _id: null, totalAmount: { $sum: "$totalAmount" } } },
    ]);

    // Fetch all delivered orders within the date range
    let orderData = await order.find({ status: "delivered", ...dateFilter }).lean();

    // Extract unique IDs for coupons, users, and products
    const couponIds = [
      ...new Set(orderData.map((order) => order.couponId).filter(Boolean)),
    ];
    const userIds = [...new Set(orderData.map((order) => order.userId))];
    const productIds = [
      ...new Set(
        orderData.flatMap((order) => order.items.map((item) => item.productId))
      ),
    ];

    // Fetch related data
    const [couponData, userData, productData] = await Promise.all([
      coupon.find({ _id: { $in: couponIds } }).lean(),
      user.find({ _id: { $in: userIds } }).lean(),
      product.find({ _id: { $in: productIds } }).lean(),
    ]);

    // Create lookup objects
    const couponLookup = Object.fromEntries(
      couponData.map((coupon) => [coupon._id.toString(), coupon])
    );
    const userLookup = Object.fromEntries(
      userData.map((user) => [user._id.toString(), user])
    );
    const productLookup = Object.fromEntries(
      productData.map((product) => [product._id.toString(), product])
    );

    // Enrich order data
    orderData = orderData.map((order) => {
      const enrichedItems = order.items.map((item) => ({
        ...item,
        productData: productLookup[item.productId.toString()] || null,
      }));

      return {
        ...order,
        userData: userLookup[order.userId.toString()] || null,
        couponData: order.couponId
          ? couponLookup[order.couponId.toString()] || null
          : null,
        items: enrichedItems,
      };
    });

    // Order count for "delivered" status
    const count = await Order.countDocuments({ status: "delivered", ...dateFilter });

    // Generate the discount report
    const discount = await generateSalesReport();
    console.log(discount);

    // Render the sales report
    res.render("adminSalesReport", {
      admin: adminData,
      order: orderData,
      totalAmount: result[0]?.totalAmount || 0,
      totalOrderCount: count,
      totaldiscount: discount.totalDiscount,
      startDate,
      endDate,
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).send("An error occurred while generating the sales report.");
  }
};


const generateSalesReport = async () => {
  try {
    // Fetch all delivered orders
    const orderData = await order.find({ status: { $eq: "delivered" } }).lean();

    // Extract unique coupon IDs
    const couponIds = [
      ...new Set(orderData.map((order) => order.couponId).filter(Boolean)),
    ];

    // Fetch coupon data for applied coupons
    const couponData = await coupon.find({ _id: { $in: couponIds } }).lean();

    // Create a coupon lookup object
    const couponLookup = Object.fromEntries(
      couponData.map((coupon) => [coupon._id.toString(), coupon])
    );

    // Initialize total discount
    let totalDiscount = 0;

    // Iterate through orders to calculate discounts
    orderData.forEach((order) => {
      const orderTotal = order.totalAmount || 0; // Ensure valid amount
      const couponId = order.couponId?.toString(); // Get coupon ID as string

      if (couponId && couponLookup[couponId]) {
        const appliedCoupon = couponLookup[couponId];

        // Check if the coupon is active and meets minimum purchase requirements
        if (
          appliedCoupon.status === "active" &&
          orderTotal >= (appliedCoupon.minPurchaseAmount || 0)
        ) {
          if (appliedCoupon.discountType === "fixed-amount") {
            // Apply fixed discount
            totalDiscount += Math.min(
              appliedCoupon.discountValue,
              appliedCoupon.maxDiscountAmount || appliedCoupon.discountValue
            );
          } else if (appliedCoupon.discountType === "percentage") {
            // Calculate percentage discount
            let discount = (orderTotal * appliedCoupon.discountValue) / 100;

            // Apply max discount limit for percentage-based discounts
            if (appliedCoupon.maxDiscountAmount) {
              discount = Math.min(discount, appliedCoupon.maxDiscountAmount);
            }

            totalDiscount += discount;
          } else {
            console.warn(
              `Unknown discount type: ${appliedCoupon.discountType} for coupon ID: ${appliedCoupon._id}`
            );
          }
        }
      }
    });

    // Return enriched data and calculated total discount
    return { orderData, totalDiscount };
  } catch (error) {
    console.error("Error generating sales report:", error.message);
    throw new Error("Failed to generate sales report");
  }
};

const DownloadPDFSalesreport = async (req, res) => {
  try {
    const adminData = req.session.adminData;

    // Fetch all delivered orders
    let orderData = await order.find({ status: { $eq: "delivered" } }).lean();
    const result = await order.aggregate([
      { $match: { status: "delivered" } },
      { $group: { _id: null, totalAmount: { $sum: "$totalAmount" } } },
    ]);

    // Extract unique IDs for coupons, users, and products
    const couponIds = [
      ...new Set(orderData.map((order) => order.couponId).filter(Boolean)),
    ];
    const userIds = [...new Set(orderData.map((order) => order.userId))];
    const productIds = [
      ...new Set(
        orderData.flatMap((order) => order.items.map((item) => item.productId))
      ),
    ];

    // Fetch related data
    const [couponData, userData, productData] = await Promise.all([
      coupon.find({ _id: { $in: couponIds } }).lean(),
      user.find({ _id: { $in: userIds } }).lean(),
      product.find({ _id: { $in: productIds } }).lean(),
    ]);

    // Create lookup objects
    const couponLookup = Object.fromEntries(
      couponData.map((coupon) => [coupon._id.toString(), coupon])
    );
    const userLookup = Object.fromEntries(
      userData.map((user) => [user._id.toString(), user])
    );
    const productLookup = Object.fromEntries(
      productData.map((product) => [product._id.toString(), product])
    );

    // Enrich order data
    orderData = orderData.map((order) => {
      const enrichedItems = order.items.map((item) => ({
        ...item,
        productData: productLookup[item.productId.toString()] || null,
      }));

      return {
        ...order,
        userData: userLookup[order.userId.toString()] || null,
        couponData: order.couponId
          ? couponLookup[order.couponId.toString()] || null
          : null,
        items: enrichedItems,
      };
    });
    console.log(orderData[0].items);

    // Create a PDF document with A4 size
    const doc = new PDFDocument({ size: "A4", margin: 20 });
    const filePath = path.join(__dirname, "sales_report.pdf");
    const writeStream = fs.createWriteStream(filePath);

    // Pipe the PDF document to the file stream
    doc.pipe(writeStream);

    // Add title and admin details
    doc.fontSize(15).text("SmartSphere Sales Report", { align: "center" });
    doc
      .fontSize(10)
      .text(`Admin: ${adminData.name}`, { align: "right", continued: false })
      .text(`Generated on: ${new Date().toLocaleString()}`, { align: "right" });
    doc
      .fontSize(20)
      .text(`Total Revenue Genarated : ${result[0].totalAmount}`, {
        align: "left",
      });

    doc.fontSize(8);
    // Define column widths, with increased space between Order ID and User Name, and 20px space between User Name and Product Name
    const colWidths = [100, 130, 100, 50, 50, 70, 70]; // Adjusted for increased space between Order ID and User Name, and 20px space between User Name and Product Name
    const headerText = [
      "Order ID",
      "User Name",
      "Product Name",
      "Quantity",
      "Price",
      "Coupon Code",
      "Total Price",
    ];

    // Add table header with better alignment
    doc.moveDown();
    headerText.forEach((text, index) => {
      doc.text(
        text,
        20 + colWidths.slice(0, index).reduce((a, b) => a + b, 0),
        180,
        { width: colWidths[index], align: "center" }
      );
    });
    doc.moveDown();

    // Add a separator line after the header
    doc
      .moveTo(20, 200)
      .lineTo(20 + colWidths.reduce((a, b) => a + b, 0), 200)
      .stroke();

    // Loop through orders and add them to the PDF with column alignment
    let yOffset = 210; // Starting Y position for the rows
    orderData.forEach((order) => {
      order.items.forEach((item) => {
        const couponCode = order.couponData ? order.couponData.code : "N/A";
        const discount = order.couponData
          ? order.couponData.maxDiscountAmount
          : "0";
        const totalAmount = order.totalAmount;

        const rowData = [
          order._id.toString(),
          order.userData?.name || "Unknown",
          item.productData?.name || item.productName,
          item.quantity.toString(),
          item.price.toString(),
          couponCode,
          totalAmount.toString(),
        ];

        // Add each row's data with correct alignment
        rowData.forEach((data, index) => {
          doc.text(
            data,
            20 + colWidths.slice(0, index).reduce((a, b) => a + b, 0),
            yOffset,
            { width: colWidths[index], align: "center" }
          );
        });

        // Add space between rows (15px gap)
        yOffset += 35; // Increase this to create more space between rows (15px between columns + row height)
      });
    });

    // Finalize the document
    doc.end();

    // Wait for the file to be fully written before sending it
    writeStream.on("finish", () => {
      res.download(filePath, "sales_report.pdf", (err) => {
        if (err) {
          console.error("Error downloading PDF:", err);
        }
        // Optionally, delete the file after download
        fs.unlinkSync(filePath);
      });
    });

    // Error handling for the write stream
    writeStream.on("error", (err) => {
      console.error("Error writing PDF file:", err);
      res.status(500).send("Error creating PDF.");
    });
  } catch (error) {
    console.log(error.message);
    res
      .status(500)
      .send("An error occurred while generating the sales report.");
  }
};

const DownloadExcelSalesReport = async (req, res) => {
  try {
    const adminData = req.session.adminData;

    // Fetch all delivered orders
    let orderData = await order.find({ status: { $eq: "delivered" } }).lean();
    const result = await order.aggregate([
      { $match: { status: "delivered" } },
      { $group: { _id: null, totalAmount: { $sum: "$totalAmount" } } },
    ]);

    // Extract unique IDs for coupons, users, and products
    const couponIds = [
      ...new Set(orderData.map((order) => order.couponId).filter(Boolean)),
    ];
    const userIds = [...new Set(orderData.map((order) => order.userId))];
    const productIds = [
      ...new Set(
        orderData.flatMap((order) => order.items.map((item) => item.productId))
      ),
    ];

    // Fetch related data
    const [couponData, userData, productData] = await Promise.all([
      coupon.find({ _id: { $in: couponIds } }).lean(),
      user.find({ _id: { $in: userIds } }).lean(),
      product.find({ _id: { $in: productIds } }).lean(),
    ]);

    // Create lookup objects
    const couponLookup = Object.fromEntries(
      couponData.map((coupon) => [coupon._id.toString(), coupon])
    );
    const userLookup = Object.fromEntries(
      userData.map((user) => [user._id.toString(), user])
    );
    const productLookup = Object.fromEntries(
      productData.map((product) => [product._id.toString(), product])
    );

    // Enrich order data
    orderData = orderData.map((order) => {
      const enrichedItems = order.items.map((item) => ({
        ...item,
        productData: productLookup[item.productId.toString()] || null,
      }));

      return {
        ...order,
        userData: userLookup[order.userId.toString()] || null,
        couponData: order.couponId
          ? couponLookup[order.couponId.toString()] || null
          : null,
        items: enrichedItems,
      };
    });

    // Calculate totals
    const totalSales = orderData.length;
    const totalDiscount = orderData.reduce((sum, order) => {
      return (
        sum + (order.couponData?.maxDiscountAmount || 0) * order.items.length
      );
    }, 0);

    // Create an Excel workbook and worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Sales Report');

    // Add title and admin details
    worksheet.mergeCells('A1:G1');
    worksheet.getCell('A1').value = 'SmartSphere Sales Report';
    worksheet.getCell('A1').alignment = { horizontal: 'center' };
    worksheet.getCell('A1').font = { bold: true, size: 15 };

    // Add admin and summary details
    worksheet.mergeCells('A2:C2');
    worksheet.getCell('A2').value = `Admin: ${adminData.name}`;
    worksheet.getCell('A2').alignment = { horizontal: 'left' };

    worksheet.mergeCells('D2:G2');
    worksheet.getCell('D2').value = `Generated on: ${new Date().toLocaleString()}`;
    worksheet.getCell('D2').alignment = { horizontal: 'right' };

    worksheet.addRow([`Total Revenue Generated: ${result[0].totalAmount}`]);
    worksheet.addRow([`Total Number of Sales: ${totalSales}`]);
    worksheet.addRow([`Total Discount Given: ${totalDiscount}`]);
    worksheet.addRow([]); // Blank row

    // Define table headers
    worksheet.addRow([
      'Order ID',
      'User Name',
      'Product Name',
      'Quantity',
      'Price',
      'Coupon Code',
      'Total Price',
    ]);

    // Apply styles to the header row
    worksheet.getRow(6).font = { bold: true };
    worksheet.getRow(6).alignment = { horizontal: 'center' };

    // Add order data to the worksheet
    orderData.forEach((order) => {
      order.items.forEach((item) => {
        const couponCode = order.couponData ? order.couponData.code : 'N/A';
        const totalAmount = order.totalAmount;

        worksheet.addRow([
          order._id.toString(),
          order.userData?.name || 'Unknown',
          item.productData?.name || item.productName,
          item.quantity,
          item.price,
          couponCode,
          totalAmount,
        ]);
      });
    });

    // Define file path and send the file for download
    const filePath = path.join(__dirname, 'sales_report.xlsx');
    await workbook.xlsx.writeFile(filePath);

    res.download(filePath, 'sales_report.xlsx', (err) => {
      if (err) {
        console.error('Error downloading Excel:', err);
      }
      // Optionally, delete the file after download
      fs.unlinkSync(filePath);
    });
  } catch (error) {
    console.error(error.message);
    res
      .status(500)
      .send('An error occurred while generating the sales report.');
  }
};





module.exports = {
  adminLoadlogin,
  adminLoadregister,
  adminRegister,
  adminVerifyLogin,
  adminDashboard,
  adminLogout,
  loadCustomer,
  customerAction,
  orderLoad,
  orderDetail,
  orderUpdate,
  salesreport,
  DownloadPDFSalesreport,
  DownloadExcelSalesReport
};
