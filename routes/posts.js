const express = require("express");
const router = express.Router();
const passport = require("passport");

const postController = require("../controllers/post_controller");

//route to create post
router
  .route("/create")
  .post(
    passport.authenticate("jwt", { session: false }),
    postController.createPost
  );

router
  .route("/posts")
  .get(
    passport.authenticate("jwt", { session: false }),
    postController.getPostFollowing
  );

//route to like and unlike post and delete post and update the caption
router
  .route("/:id")
  .get(
    passport.authenticate("jwt", { session: false }),
    postController.likeAndUnlikePost
  )
  .put(
    passport.authenticate("jwt", { session: false }),
    postController.updateCaption
  )
  .delete(
    passport.authenticate("jwt", { session: false }),
    postController.deletePost
  );

//add or update the comment
router
  .route("/comment/:id")
  .put(
    passport.authenticate("jwt", { session: false }),
    postController.commentOnPost
  );

router
  .route("/comment/:id")
  .delete(
    passport.authenticate("jwt", { session: false }),
    postController.deleteComment
  );

module.exports = router;
