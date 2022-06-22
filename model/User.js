const mongoose = require('mongoose');
const bycrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require("dotenv").config({path:"../env/config.env"})
const crypto = require('crypto')
const userSchema = new mongoose.Schema({
    name:{
        type:String,
        required:[true, "Please Enter your name"]
    },
    avatar:{
        public_id:String,
        url:String,
    },
    email:{
        type:String,
        required:[true,"Please Enter your email"],
        unique:[true, "Email already Exists"]
    },
    password:{
        type:String,
        required:[true,"Please Enter password"],
        minlength:[6,"Enter 6 digits password"],
        select:false
    },
    posts:[
        {
            type:mongoose.Schema.Types.ObjectId,
            ref:'Post'
        }
    ],
    followers:[{
        type:mongoose.Schema.Types.ObjectId,
            ref:'User'
    }],
    following:[{
        type:mongoose.Schema.Types.ObjectId,
            ref:'User'
    }],
    resetPasswordToken: String,
    resetTokenExpire:Date

})

userSchema.pre("save", async function(next){
    if(!this.isModified("password")){
        next();
    }
    const salt = await bycrypt.genSalt(10);
    this.password = await bycrypt.hash(this.password, salt);
    next();
})

//match login password
userSchema.methods.matchPassword = async function(password){
    return await bycrypt.compareSync(password, this.password);
}

//generate token
userSchema.methods.generateToken =  function(){
    return jwt.sign({
        id:this._id,
        email:this.email,
        name:this.name,
        password:this.password
    }, process.env.JWT_SECRET, {expiresIn: '1h'} );
}

//generate reset password token
userSchema.methods.getResetPasswordToken = function(){
    const resetToken = crypto.randomBytes(20).toString("hex");
    
    this.resetPasswordToken = crypto.createHash("sha256").update(resetToken).digest("hex");
    this.resetTokenExpire = Date.now() + 5 *60 * 1000;
    return resetToken;
}


module.exports = mongoose.model("User", userSchema);