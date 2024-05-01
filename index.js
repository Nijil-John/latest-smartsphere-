const mongoose =require("mongoose")
mongoose.connect("mongodb://127.0.0.1:27017/eCommerce")

const express = require('express')
const app = express()
const port = 3000

app.use(express.static('assets'))

const adminRoute = require("./routes/adminRoute")//adminroute from routes
const userRoute = require("./routes/userRoute")//user from routes

app.use('/admin',adminRoute)
app.use('/',userRoute)

app.listen(port, () => console.log(`listening on port ${port}!`))


