const express = require('express')
const Database = require('./config/Database')
const app = express()
Database.connectDb() //database connections
const port = 3000

app.use('/admin/productAssets', express.static('productAssets'));


app.use(express.urlencoded({ extended: true }));

app.use(express.json())

app.set('view engine', 'ejs');


const adminRoute = require("./routes/adminRoute")//adminroute from routes
const userRoute = require("./routes/userRoute")//user from routes

app.use('/admin',adminRoute)
app.use('/',userRoute)

app.listen(port, () => console.log(`listening on port ${port}!`))


