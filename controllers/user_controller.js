const User = require("../model/User");
const Post = require("../model/Post");
const { sendEmail } = require("../middleware/nodemailer");
const crypto = require("crypto");
const cloudinary = require("cloudinary");

//register user
exports.register = async (req, res) => {
  try {
    
    const { name, email, password, avatar } = req.body;

    let user = await User.findOne({ email });

    //user exist
    if (user) {
      return res.status(400).json({
        success: false,
        message: "User already Exists",
      });
    }

    //upload image to cloudinary
    const myCloud = await cloudinary.v2.uploader.upload(avatar,{
      folder: "avatars",
    })

    //create user
    user = await User.create({
      name,
      email,
      password,
      avatar: { public_id: myCloud.public_id, url: myCloud.secure_url },
    });
    await user.save();
    let token = user.generateToken();
    const options = {
      expires: new Date(Date.now() + 60 * 60 * 10000),
      httpOnly: true,
    };
    token = "Bearer " + token;

    res.status(200).cookie("token", token, options).json({
      success: true,
      user,
      token: token,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

//login user
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    let user = await User.findOne({ email }).select("+password").populate("posts followers following"); ;
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "user doesn't exist",
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Invaild Creditinals",
      });
    }

    let token = user.generateToken();
    const options = {
      httpOnly: true,
    };
    token = "Bearer " + token;

    res.status(200).cookie("token", token, options).json({
      success: true,
      user,
      token: token,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//logout
exports.logout = async (req, res) => {
  res
    .status(200)
    .cookie("token", null, { expires: new Date(Date.now()), httpOnly: true })
    .json({
      success: true,
      message: "Logged Out Successfully!",
    });
};

//follow user
exports.followUser = async (req, res) => {
  try {
    const userToFollow = await User.findById(req.params.id);
    const userLoggedIn = await User.findById(req.user._id);
    if (!userToFollow) {
      return res.status(500).json({
        success: false,
        message: "User Not found",
      });
    }

    if (userLoggedIn.following.includes(userToFollow._id)) {
      userLoggedIn.following.pull(userToFollow._id);
      userToFollow.followers.pull(userLoggedIn._id);
      await userLoggedIn.save();
      await userToFollow.save();
      res.status(200).json({
        success: true,
        message: "User Unfollowed",
      });
    } else {
      //push follower id to logged in user following
      userLoggedIn.following.push(userToFollow._id);

      //push logged in user id to follower
      userToFollow.followers.push(userLoggedIn._id);

      await userLoggedIn.save();
      await userToFollow.save();

      res.status(200).json({
        success: true,
        message: "User Followed",
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//update password
exports.updatePassword = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("+password");
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Please Provide old and new password",
      });
    }

    const isMatch = await user.matchPassword(oldPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Incorrect Old Password",
      });
    }

    user.password = newPassword;
    await user.save();
    res.status(200).json({
      success: true,
      message: "Password Updated",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

//update profile
exports.updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const { name, email, avatar } = req.body;
    if (!name && !email) {
      return res.status(400).json({
        success: false,
        message: "Please provide name and email",
      });
    }
    if (name) {
      user.name = name;
    }
    if (email) {
      user.email = email;
    }
    if(avatar){
      await cloudinary.v2.uploader.destroy(user.avatar.public_id);
      const myCloud = await cloudinary.v2.uploader.upload(avatar,{folder: "avatars"});
      user.avatar.public_id= myCloud.public_id;
      user.avatar.url= myCloud.secure_url;
      }
    await user.save();

   return res.status(200).json({
      success: true,
      message: "Profile Updated",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//delete profile
exports.deleteProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const posts = user.posts;
    const followers = user.followers;
    const userID = user._id;
    const following = user.following;
    await cloudinary.v2.uploader.destroy(user.avatar.public_id)
    await user.remove();

    //logout after deleting the profile
    res.cookie("tokken", "", { expires: new Date(Date.now()), httpOnly: true });

    //remove post associated with deleting user
    for (let i = 0; i < posts.length; i++) {
      const post = await Post.findById(posts[i]);
      await cloudinary.v2.uploader.destroy(post.image.public_id);
      await post.remove();
    }

    //remove user from followers following
    for (let i = 0; i < followers.length; i++) {
      const follower = await User.findById(followers[i]);
      follower.following.pull(userID);
      await follower.save();
    }

    //remove user from following followers
    for (let i = 0; i < following.length; i++) {
      const follows = await User.findById(following[i]);
      follows.followers.pull(userID);
      await follows.save();
    }

    //removing all comments of the user from all posts
    const allPosts = await Post.find();
    for (let i = 0; i < allPosts.length; i++) {
      const post = await Post.findById(allPosts[i]._id);
      for(let j = 0; j < allPosts.comments.length; j++){
        if(post.comments[j].user===userID){
          post.comments.splice(j,1);
        }
      }
      await post.save();
    }

    //removing all likes of the user from all posts
    for (let i = 0; i < allPosts.length; i++) {
      const post = await Post.findById(allPosts[i]._id);
      for(let j = 0; j < allPosts.likes.length; j++){
        if(post.likes[j].user===userID){
          post.likes.splice(j,1);
        }
      }
      await post.save();
    }

    res.status(200).json({
      success: true,
      message: "Profile Deleted",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

//my profile
exports.myProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate("posts followers following");
    res.status(200).json({
      success: true,
      user,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

//get user profile
exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate("posts followers following");
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User Not found",
      });
    }

    res.status(200).json({
      success: true,
      user,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

//get all the users
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find({name:{$regex:req.query.name, $options:'i'}});
    res.status(200).json({
      success: true,
      users,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

//get my post
exports.myPosts = async (req, res) => {
  try {
    const users = await User.findById(req.user._id);
    const posts=[];
    for(let i=0;i<users.posts.length;i++){
      const post = await Post.findById(users.posts[i]).populate("owner likes comments.user");
      posts.push(post);
    }
    res.status(200).json({
      success: true,
      posts,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }

}

//Get Users Posts
exports.getUserPosts = async (req, res) => {
  try {
    const users = await User.findById(req.params.id);
    const posts=[];
    for(let i=0;i<users.posts.length;i++){
      const post = await Post.findById(users.posts[i]).populate("owner likes comments.user");
      posts.push(post);
    }
    res.status(200).json({
      success: true,
      posts,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }

}

//forgot password
exports.forgotPassword = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User Not found",
      });
    }

    const resetPasswordToken = user.getResetPasswordToken();

    await user.save();

    //create url for reset password
    const resetURL = `https://sociobook.netlify.app/reset/password/${resetPasswordToken}`;

    //create message
    const message = `Reset Your password by clicking on the below link: \n\n ${resetURL}`;
    try {
      await sendEmail({
        email: user.email,
        subject: "Reset Password",
        message,
      });
      res.status(200).json({
        success: true,
        message: `Email has sent to ${user.email}`,
      });
    } catch (error) {
      user.resetPasswordToken = undefined;
      user.resetTokenExpire = undefined;
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

//reset password
exports.resetPassword = async (req, res) => {
  try {
    const resetPasswordToken = crypto
      .createHash("sha256")
      .update(req.params.token)
      .digest("hex");

    const user = await User.findOne({
      resetPasswordToken,
      resetTokenExpire: { $gt: Date.now() },
    });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Token is Invalid or Expire",
      });
    }
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetTokenExpire = undefined;
    await user.save();
    res.status(200).json({
      success: true,
      message: "Password Updated",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
