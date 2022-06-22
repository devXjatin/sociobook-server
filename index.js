const express = require("express");
const connectDB = require("./config/database");
const cookieParser = require("cookie-parser");
const app = express();
const passport = require("passport");
require("./config/passport-jwt");
connectDB();
const cloudinary = require("cloudinary");
const path = require("path");
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});
require("dotenv").config({ path: "backend/env/config.env" });

// //import config dot.env file

if (process.env.NODE_ENV !== "production") {
  require("dotenv").config({ path: "backend/env/config.env" });
  
}
app.use(cookieParser());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(passport.initialize());


app.use("/", require("./routes"));

app.get('/', (req, res) => {
  res.send("API is running");
})

const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
