const express = require('express');
const router = express.Router();
const passport = require("passport");

const userController= require('../controllers/user_controller')

//register user
router.route("/register").post(userController.register);

//login route
router.route("/login").post(userController.login);

//logout route
router.route("/logout").get(userController.logout);

//follow route
router.route('/follow/:id').get(passport.authenticate("jwt", { session: false }),userController.followUser);

//update password
router.route("/update/password").put(passport.authenticate("jwt", {session:false}), userController.updatePassword);

//update user profile
router.route("/update/profile").put(passport.authenticate("jwt", {session:false}), userController.updateProfile);

//get all the users
router.route("/users").get(passport.authenticate("jwt", {session:false}), userController.getAllUsers);

//my post
router.route("/my/posts").get(passport.authenticate("jwt", {session:false}), userController.myPosts);



//delete profile
router.route("/delete/me").delete(passport.authenticate("jwt", {session:false}), userController.deleteProfile);

//user posts
router.route("/userposts/:id").get(passport.authenticate("jwt", {session:false}), userController.getUserPosts);

//my profile
router.route("/me").get(passport.authenticate("jwt", {session:false}), userController.myProfile);

//get User profile
router.route("/:id").get(passport.authenticate("jwt", {session:false}), userController.getUserProfile);


//forgot password
router.route("/forgot/password").post(userController.forgotPassword);

//reset password 
router.route("/reset/password/:token").put(userController.resetPassword);



module.exports = router;