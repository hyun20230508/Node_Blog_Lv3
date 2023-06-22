const express = require("express");
const router = express.Router();
const Comments = require("../schemas/comment.js");
const Posts = require("../schemas/post.js");
const authMiddleware = require("../middlewares/auth-middleware.js");

// 코멘트 작성 api
router.post("/posts/:postId/comments", authMiddleware, async (req, res) => {
  const user = res.locals.user;
  const { postId } = req.params;
  const { comment } = req.body;

  try {
    const existsPosts = await Posts.findOne({ _id: postId });
    if (!existsPosts) {
      res.status(404).json({
        errorMessage: "게시글이 존재하지 않습니다.",
      });
      return;
    }
    if (comment === "") {
      return res
        .status(412)
        .json({ errorMessage: "댓글 내용을 작성해주세요." });
    }
    await Comments.create({
      userId: user._id,
      postId: postId,
      nickname: user.nickname,
      comment: comment,
    });
  } catch (error) {
    res.status(400).json({ errorMessage: "댓글 작성에 실패하였습니다." });
    return;
  }
  res.json({ message: "댓글을 작성하였습니다." });
});

// 댓글 목록 조회 api
router.get("/posts/:postId/comments", async (req, res) => {
  const { postId } = req.params;
  const comments = await Comments.find({ postId }).sort("-createdAt").exec();

  try {
    if (!comments) {
      res.status(400).json({
        message: "조회 가능한 댓글이 존재하지 않습니다. 댓글을 작성해주세요.",
      });
      return;
    }

    const priComments = comments.map((item) => {
      return {
        commentId: item._id,
        userId: item.userId,
        nickname: item.nickname,
        comment: item.comment,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      };
    });
    res.status(200).json({ comments: priComments });
  } catch (error) {
    res.status(400).json({ errorMessage: "댓글 조회에 실패하였습니다." });
    return;
  }
});

// 댓글 수정 api
router.put(
  "/posts/:postId/comments/:commentId",
  authMiddleware,
  async (req, res) => {
    const { userId } = res.locals.user;
    const { postId, commentId } = req.params;
    const { comment } = req.body;

    if (comment == "") {
      res.status(412).json({
        errorMessage: "데이터 형식이 올바르지 않습니다.",
      });
    }
    try {
      const existsComments = await Comments.findOne({ _id: commentId });
      const nowTime = Date.now();
      if (!existsComments) {
        res.status(404).json({
          errorMessage: "댓글이 존재하지 않습니다.",
        });
        return;
      }
      if (existsComments !== postId) {
        res.status(400).json({
          errorMessage: "다른 게시글의 댓글을 수정 시도중입니다.",
        });
        return;
      }
      if (existsComments.userId === userId) {
        await Comments.updateOne(
          { userId, postId, _id: commentId },
          { $set: { comment: comment, updatedAt: nowTime } }
        );
      } else {
        res.status(403).json({
          errorMessage: "수정 권한이 존재하지 않습니다.",
        });
        return;
      }
    } catch (error) {
      res.status(400).json({ errorMessage: "비정상적인 접근입니다." });
      return;
    }
    res.status(200).json({ message: "댓글을 수정하였습니다." });
  }
);

// 댓글 삭제 api
router.delete(
  "/posts/:postId/comments/:commentId",
  authMiddleware,
  async (req, res) => {
    const { userId } = res.locals.user;
    const { postId, commentId } = req.params;

    try {
      const existsComments = await Comments.findOne({ _id: commentId });
      if (!existsComments) {
        res.status(404).json({
          errorMessage: "댓글이 존재하지 않습니다.",
        });
        return;
      }
      if (existsComments !== postId) {
        res.status(400).json({
          errorMessage: "다른 게시글의 댓글을 삭제 시도중입니다.",
        });
        return;
      }
      if (existsComments.userId === userId) {
        await Comments.deleteOne({ userId, postId, _id: commentId });
      } else {
        res.status(403).json({
          errorMessage: "삭제 권한이 존재하지 않습니다.",
        });
        return;
      }
      res.status(200).json({ message: "댓글을 삭제하였습니다." });
    } catch (error) {
      res.status(400).json({ errorMessage: "비정상적인 접근입니다." });
      return;
    }
  }
);

module.exports = router;
