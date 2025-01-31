require('dotenv').config();
const express = require('express')
const Database = require('./config/Database')
const app = express()
const path = require('path')
Database.connectDb() //database connections
const errorHandler = require('./middleware/errorHandler');
const port = process.env.PORT 
app.use('/admin/productAssets', express.static('productAssets'));
app.use('/productAssets/', express.static('productAssets'));
app.use('/userAssets', express.static(path.join(__dirname, 'userAssets')));

app.use(express.urlencoded({ extended: true }));

app.use(express.json())

app.set('view engine', 'ejs');

// Error handling middleware
app.use(errorHandler);


const adminRoute = require("./routes/adminRoute")//adminroute from routes
const userRoute = require("./routes/userRoute")//user from routes

app.use('/admin',adminRoute)
app.use('/',userRoute)

app.listen(port, () => console.log(`listening on port ${port}!`))


