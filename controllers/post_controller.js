const Post = require("../model/Post");
const User = require("../model/User");
const cloudinary = require('cloudinary')
exports.createPost = async (req, res) => {
  try {

    const myCloud = await cloudinary.v2.uploader.upload(req.body.image,{
      folder:'posts',
    });

    const newPostData = {
      caption: req.body.caption,
      image: {
        public_id: myCloud.public_id,
        url: myCloud.secure_url,
      },
      owner: req.user._id,
    };
    const post = await Post.create(newPostData);
    const user = await User.findById(req.user._id);
    user.posts.unshift(post._id);
    await user.save();
    res.status(201).json({
      success: true,
      message:"Post Created"
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post Not Found",
      });
    }

    //user is not authorised
    if (post.owner.toString() !== req.user._id.toString()) {
      return res.status(401).json({
        success: false,
        message: "Unauthorised",
      });
    }

    //delete image from cloudinary
    await cloudinary.v2.uploader.destroy(post.image.public_id);

    // Delete Post
    await post.remove();

    //remove post id from user model
    const user = await User.findById(req.user._id);
    user.posts.pull(req.params.id);
    await user.save();
    return res.status(200).json({
      success: true,
      message: "Post Deleted",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//create like and unlike controller
exports.likeAndUnlikePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post no found",
      });
    }

    //unlike condition
    if (post.likes.includes(req.user._id)) {
      // const index = post.likes.indexOf(req.user._id);

      // post.likes.splice(index, 1);
      post.likes.pull(req.user._id);

      await post.save();

      return res.status(200).json({
        success: true,
        message: "Post Unliked",
      });
    } else {
      //created like
      post.likes.push(req.user._id);
      await post.save();
      return res.status(200).json({
        success: true,
        message: "Post Liked",
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//get post of following user
exports.getPostFollowing = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const posts = await Post.find({
      owner: {
        $in: user.following
      },
    }).populate("owner likes comments.user");
    return res.status(200).json({
      success: true,
      posts: posts.reverse()    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

//update caption of post
exports.updateCaption = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }
    if (post.owner.toString() !== req.user._id.toString()) {
      return res.status(401).json({
        success: false,
        message: "Unauthorised user",
      });
    }
    post.caption = req.body.caption;
    await post.save();
    res.status(200).json({
      success: true,
      message: "Post Updated",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//add or update Comment
exports.commentOnPost = async (req, res) => {
  console.log(req.user)
  try {
    const post = await Post.findById(req.params.id);
    if(!post){
      return res.status(404).json({
        success:false,
        message:"Post Not Found"
      })
    }

    //checking if commented user is exist or not
    let commentIndex = -1;
    post.comments.forEach((item, index)=>{
      if(item.user.toString() === req.user._id.toString()){
        commentIndex = index;
      }
    })

    if(commentIndex !== -1){
      post.comments[commentIndex].comment = req.body.comment;
      await post.save();
      return res.status(200).json({
        success:true,
        message:"Comment Updated"
      })

    }else{
      post.comments.push({
        user:req.user._id,
        comment:req.body.comment
      })
    }
    await post.save();
    return res.status(200).json({
      success:true,
      message:"Comment Added"
    })


  } catch (error) {
    res.status(500).json({
      success:false,
      message:error.message
    })
  }
};


//delete comment
exports.deleteComment = async(req, res)=>{
  try {
    console.log(req.body.commentId)

    const post = await Post.findById(req.params.id);

    //if post not found
    if(!post){
      return res.status(500).json({
        success:false,
        message:"Post Not Found"
      })
    }
    //check if owner wants to delete the comment
    if (post.owner.toString() === req.user._id.toString()) {
      //if commentID is not provided
      if(req.body.commentId === undefined){
        return res.status(400).json({
          success:false,
          message:"CommentID is not provided"
        })
      }
      post.comments.forEach((item, index)=>{
        if(item._id.toString()=== req.body.commentId.toString()){
          post.comments.splice(index, 1);
        }
      })
      await post.save();
      return res.status(200).json({
        success:true,
        message:"Selected Comment has deleted"
      })
      
    } else {

      // if the commented user deleted thier post
      post.comments.forEach((item,index)=>{
        if(item.user.toString()=== req.user._id.toString()){
          return post.comments.splice(index, 1)
        }
      })
    }
    await post.save();
    return res.status(200).json({
      success:true,
      message:"Your Comment has Deleted."
    })
    
  } catch (err) {
    res.status(500).json({
      success:false,
      message:err.message
    })
  }
}

