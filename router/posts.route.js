const express = require("express");
const router = express.Router();
const { Op } = require("sequelize");
const { Posts } = require("../models");
const { Users } = require("../models");
const authMiddleware = require("../middlewares/auth-middleware.js");

// 전체 게시글 조회 api
router.get("/posts", async (req, res) => {
  try {
    const posts = await Posts.findAll({
      attributes: ["postId", "title", "createdAt", "updatedAt"],
      include: [
        {
          model: Users,
          attributes: ["userId", "nickname"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });
    if (!posts) {
      res.status(400).json({
        errorMessage: "게시글이 존재하지 않습니다. 글을 작성해주세요.",
      });
    }
    const prPosts = posts.map((item) => {
      return {
        postId: item.postId,
        userId: item.User.userId,
        title: item.title,
        nickname: item.User.nickname,
        content: item.content,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      };
    });
    res.status(200).json({ prPosts });
  } catch (error) {
    res.status(400).json({ errorMessage: "게시글 조회에 실패했습니다." });
    return;
  }
});

// 게시글 상세 조회 api
router.get("/posts/:postId", async (req, res) => {
  const { postId } = req.params;
  try {
    const post = await Posts.findOne({
      attributes: ["postId", "title", "content", "createdAt", "updatedAt"],
      include: [
        {
          model: Users,
          attributes: ["userId", "nickname"],
        },
      ],
      where: { postId },
    });

    if (!post) {
      res.status(404).json({
        errorMessage: "존재하지 않는 게시글입니다.",
      });
      return;
    }

    const prPost = [post].map((item) => {
      return {
        postId: item.postId,
        userId: item.User.userId,
        title: item.title,
        nickname: item.User.nickname,
        content: item.content,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      };
    });

    res.status(200).json({ prPost });
  } catch (error) {
    res.status(400).json({ errorMessage: "게시글 조회에 실패했습니다." });
    return;
  }
});

// 게시글 작성 api
router.post("/posts", authMiddleware, async (req, res) => {
  const { title, content } = req.body;
  const { userId } = res.locals.user;
  try {
    if (title === "" || content === "") {
      return res
        .status(412)
        .json({ errorMessage: "제목과 내용을 작성해주세요." });
    }

    await Posts.create({
      UserId: userId,
      title,
      content,
    });
    res.status(201).json({ message: "게시글을 작성하였습니다." });
  } catch (error) {
    res.status(400).json({ errorMessage: "게시글 작성에 실패했습니다." });
    return;
  }
});

// 게시글 수정 api
router.put("/posts/:postId", authMiddleware, async (req, res) => {
  const { userId } = res.locals.user;
  const { postId } = req.params;
  const { title, content } = req.body;

  if (title == "" || content == "") {
    res.status(412).json({
      errorMessage: "제목 또는 게시글의 형식이 올바르지 않습니다.",
    });
    return;
  }
  try {
    const existsPosts = await Posts.findOne({ where: { postId } });
    if (!existsPosts) {
      res.status(404).json({
        errorMessage: "게시글이 존재하지 않습니다.",
      });
      return;
    }
    if (existsPosts.UserId === userId) {
      await Posts.update(
        { title, content },
        {
          where: {
            [Op.and]: [{ postId }, { UserId: userId }],
          },
        }
      );
    } else {
      res.status(403).json({
        errorMessage: "수정 권한이 존재하지 않습니다.",
      });
      return;
    }
    res.status(200).json({ message: "게시글을 수정하였습니다." });
  } catch (error) {
    res.status(400).json({ errorMessage: "비정상적인 접근입니다." });
    return;
  }
});

// 게시글 삭제 api
router.delete("/posts/:postId", authMiddleware, async (req, res) => {
  const { userId } = res.locals.user;
  const { postId } = req.params;

  try {
    const existsPosts = await Posts.findOne({ where: { postId } });
    if (!existsPosts) {
      res.status(404).json({
        errorMessage: "게시글이 존재하지 않습니다.",
      });
      return;
    }
    if (existsPosts.UserId === userId) {
      await Posts.destroy({
        where: { [Op.and]: [{ postId }, { UserId: userId }] },
      });
    } else {
      res.status(403).json({
        errorMessage: "삭제 권한이 존재하지 않습니다.",
      });
      return;
    }
    res.status(200).json({ message: "게시글을 삭제하였습니다." });
  } catch (error) {
    res.status(400).json({ errorMessage: "비정상적인 접근입니다." });
    return;
  }
});

module.exports = router;
