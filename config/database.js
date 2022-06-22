const mongoose = require('mongoose');
require("dotenv").config({path:"backend/env/config.env"});

const connectDatabase = ()=>{
     mongoose.connect(process.env.MONGO_URI,
        {
     }).then((con)=>{
        console.log(`Database Connected ${con.connection.host}`);
    }).catch((err)=>{
        console.log(`Databse is not connected ${err}`);
    })
}

module.exports = connectDatabase;