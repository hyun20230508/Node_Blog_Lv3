const express = require("express");
const cookiParser = require("cookie-parser");
const app = express();
const port = 3001;

const userRouter = require("./router/users.route.js");
const postsRouter = require("./router/posts.route.js");

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookiParser());
app.use("/api", [userRouter, postsRouter]);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(port, "포트로 서버가 열렸어요!");
});
