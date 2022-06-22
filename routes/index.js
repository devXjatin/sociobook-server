const express = require('express')
const router = express.Router();
const passport = require('passport');
// const homeController = require('../controllers/home_controller')
// router.route('/', ).get(passport.authenticate('jwt', {session:false}),(req, res)=>{
//     res.status(200).json({
//         success:true,
//         user:req.user
//     })
// });


//post route
router.use('/post', require('./posts'))

//user route
router.use('/user', require('./users'));

module.exports = router;