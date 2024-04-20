const express = require("express");
const UserModel = require("../Auth/auth.schema");
const app = express();
const nodemailer = require("nodemailer");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
app.use(cookieParser());
dotenv.config();
const USER = process.env.USER;
const PASS = process.env.PASS;
app.set("view engine", "ejs");
app.use(express.json());

const JWT_SECERT = process.env.JWT_SECERT;
const isAdmin = async (req, res, next) => {
  try {
    const cookie = req.headers.cookie;
    if (!cookie) {
      return res.status(404).json({ message: "No Cookie" });
    }
    const token = cookie.split("=")[1];

    if (!token) {
      return res
        .status(401)
        .json({ message: "Unauthorized: No token provided" });
    }
    const decoded = jwt.verify(token, JWT_SECERT);

    if (decoded.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Forbidden: Only admin can access this route" });
    }
    req.user = decoded;
    next();
  } catch (error) {
    console.error(error);
    return res.status(401).json({ message: "Unauthorized: Invalid token" });
  }
};
const isUserValid = async (req, res, next) => {
  const { id } = req.params;
  const { email } = req.query;

  try {
    const cookie = req.headers.cookie;
    if (!cookie) {
      return res.status(404).json({ message: "No Cookie" });
    }
    const token = cookie.split("=")[1];

    if (!token) {
      return res
        .status(401)
        .json({ message: "Unauthorized: No token provided" });
    }
    const decoded = jwt.verify(token, JWT_SECERT);

    if (decoded.email !== email) {
      return res.status(403).json({ message: "invalid Token " });
    }
    req.user = decoded;
    next();
  } catch (error) {
    console.error(error);
    return res.status(401).json({ message: "Unauthorized: Invalid token" });
  }
};
const verifyToken = (req, res, next) => {
  const cookie = req.headers.cookie;
  if (!cookie) {
    return res.status(404).json({ message: "No Cookie" });
  }
  const token = cookie.split("=")[1];
  if (!token) {
    return res.status(404).json({ message: "Token is not found" });
  }
  jwt.verify(String(token), JWT_SECERT, (err, user) => {
    if (err) {
      res.status(400).json({ message: "Invalide Token" });
    }
    req.id = user.id;
  });
  next();
};
const authFunction = async (user, res) => {
  const token = jwt.sign(
    { id: user._id, role: user.role, email: user.email },
    JWT_SECERT
  );

  return res
    .cookie("access_token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      expires: new Date(Date.now() + 360000 * 27 * 7),
      path: "/",
    })
    .status(200)
    .json({
      msg: "LOGIN SUCCESS",
      auth: true,
      email: user.email,
      userName: user.name,
      id: user._id,
      role: user.role,
      profilePic: user.profilePic,
    });
};
app.get("/", isAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 5;
    const skip = (page - 1) * limit;
    let searchQuery = {};
    if (req.query.search) {
      searchQuery = {
        name: { $regex: new RegExp(req.query.search, "i") },
      };
    }
    const users = await UserModel.find(searchQuery).skip(skip).limit(limit);

    const totalUsers = await UserModel.countDocuments(searchQuery);
    const totalPages = Math.ceil(totalUsers / limit);

    return res.json({
      users,
      totalPages,
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});
app.get("/signin-token", verifyToken, async (req, res) => {
  const userId = req.id;

  let user;
  try {
    user = await UserModel.findById(userId, "-pass");
  } catch (err) {
    return new Error(err);
  }
  if (!user) {
    return res.status(404).json({ message: "user not found" });
  }
  return res.status(200).json({
    msg: "LOGIN SUCCESS",
    auth: true,
    email: user.email,
    userName: user.name,
    id: user._id,
    role: user.role,
    profilePic: user.profilePic,
  });
});
app.get("/logout", (req, res) => {
  res.clearCookie("access_token", {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    expires: new Date(0),
    path: "/",
  });

  res.status(200).json({ msg: "Logout successful", auth: false });
});
app.get("/:id", isUserValid, async (req, res) => {
  const { id } = req.params;
  try {
    const user = await UserModel.findOne({ _id: id });
    return res.status(200).send(user);
  } catch (err) {
    return res.status(400).send({ err: err });
  }
});

app.get("/reset-pass/:id/:token", async (req, res) => {
  const { id, token } = req.params;
  const oldDetails = await UserModel.findOne({ _id: id });
  if (!oldDetails) {
    return res.status(404).send({ message: "user not found" });
  }
  try {
    const verify = jwt.verify(token, JWT_SECERT);
    res.render("index", { email: verify.email });
  } catch (e) {
    res.status(404).send({ message: "Not verified" });
  }
});
// app.get("/refresh-token", (req, res) => {
//   const cookie = req.headers.cookie;
//   const prevToken = cookie.split("=")[1];
//   if (!prevToken) {
//     res.status(400).json({ message: "Token is not found" });
//   }
//   jwt.verify(
//     (String(prevToken),
//     JWT_SECERT,
//     (err, user) => {
//       if (err) {
//
//         return res.status(403).json({ message: "Authentication failed" });
//       }
//       res.clearCookie(`${user._id}`);
//       req.cookies[`${user._id}`] = "";
//       const token = jwt.sign(user._id, JWT_SECERT, {
//         expiresIn: new Date(Date.now() + 30 * 10000),
//       });
//       res
//         .status(200)
//         .json({ message: "Refresh token generated successfully" })
//         .cookie("access_token", token, {
//           httpOnly: true,
//           expires: new Date(Date.now() + 360000 * 27 * 7),
//         });
//     })
//   );
// });

app.post("/signin", async (req, res) => {
  const { email, pass } = req.body;

  const user = await UserModel.findOne({ email });

  if (!user) {
    return res.status(404).send({ msg: "User not found", auth: false });
  }
  const hashPass = await bcrypt.compare(pass, user.pass);
  if (user.block) {
    const blocktime = new Date() - new Date(user.lockUntil);
    const hoursLeft = Math.ceil(blocktime / (1000 * 60 * 60));

    if (hoursLeft <= 24) {
      return res.status(503).send({
        msg: `Your account has been blocked, try again after ${
          24 - hoursLeft
        } hours `,
        auth: false,
      });
    } else {
      await UserModel.updateOne(
        { email: email },
        {
          $set: {
            block: false,
            lockUntil: 0,
            loginAttempts: 0,
          },
        }
      );
      if (hashPass) {
        authFunction(user, res);
      }
    }
  }

  if (user.loginAttempts >= 5) {
    await UserModel.updateOne(
      { email: email },
      { $set: { block: true, lockUntil: new Date() } }
    );
    return res.status(503).send({
      msg: "You are blocked for 24 hours",
      auth: false,
    });
  }

  if (!hashPass) {
    await UserModel.updateOne({ email: email }, { $inc: { loginAttempts: 1 } });
    return res.status(401).send({
      msg: "Password is not correct",
      auth: false,
    });
  } else {
    await UserModel.updateOne(
      { email: email },
      {
        $set: {
          loginAttempts: 0,
          lockuntil: 0,
          block: false,
        },
      }
    );

    authFunction(user, res);
  }
});
app.post("/signup", async (req, res) => {
  const { name, email, pass } = req.body;

  try {
    const eUser = await UserModel.findOne({ email });
    if (eUser) {
      return res.status(409).send({ error: "Email already registered" });
    }

    const hash = await bcrypt.hash(pass, 10);
    const user = new UserModel({
      name,
      email,
      pass: hash,
    });
    await user.save();

    return res.status(201).send({ msg: "User Created" });
  } catch (e) {
    return res.status(500).send({ error: "An error occurred during signup" });
  }
});
app.post("/oauth", async (req, res) => {
  const user = await UserModel.find({ email: req.body.email });
  if (user) {
    const token = jwt.sign({ id: user._id }, JWT_SECERT);
    res.cookie("access_token", token, {
      httpOnly: true,
      expires: new Date(Date.now() + 36000000).status(200).send({}),
    });
  }
});
app.post("/forgot-password", async (req, res) => {
  const { email } = req.body;
  console.log(email, USER);

  try {
    const oldDetails = await UserModel.findOne({ email });
    if (!oldDetails) {
      return res.status(404).send({ message: "user does not exits" });
    }

    const token = jwt.sign(
      { email: oldDetails.email, _id: oldDetails._id },
      JWT_SECERT
    );

    const link = `https://surtiesserver.onrender.com/auth/reset-pass/${oldDetails._id}/${token}`;
    const transporter = nodemailer.createTransport({
      service: "gmail",
      host: "smtp.gmail.net",
      port: 465,
      secure: true,
      auth: {
        user: USER,
        pass: PASS,
      },
    });
    const mailOption = {
      from: USER,
      to: email,
      subject: `${"Reset Your Password"}`,
      text: link,
    };
    const sendMail = async (transporter, mailOption) => {
      try {
        await transporter.sendMail(mailOption);
      } catch (error) {
        console.log(error);
        return res
          .status(500)
          .send(
            "The server encountered an unexpected condition that prevented it from fulfilling the request."
          );
      }
    };
    sendMail(transporter, mailOption);
    return res.status(200).send("mail has been sent");
  } catch (err) {
    console.log(err);
  }
});

app.post("/reset-pass/:id/:token", async (req, res) => {
  const { id, token } = req.params;
  const { pass } = req.body;
  const oldDetails = await UserModel.findOne({ _id: id });
  if (!oldDetails) {
    return res.status(404).send({ message: "user not found" });
  }
  try {
    const hash = await bcrypt.hash(pass, 10);
    const verify = jwt.verify(token, JWT_SECERT);
    await UserModel.updateOne(
      { _id: id },
      {
        pass: hash,
      }
    );
    res.status(200).send({ message: "password updated" });
  } catch (e) {
    console.log(e);
    res.status(404).send({ message: "Not verified" });
  }
});

app.patch("/:id", isAdmin, async (req, res) => {
  try {
    const userId = req.params.id;

    const user = await UserModel.find({ _id: userId });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user[0].role == "admin") {
      return res.status(403).json({ message: "Admin can't be modified" });
    }
    if (user[0].role == "newsEditor") {
      await UserModel.findOneAndUpdate(
        { _id: userId },
        { $set: { role: "user" } }
      );
      return res.status(200).json({ message: "User updated to user" });
    } else {
      await UserModel.findOneAndUpdate(
        { _id: userId },
        { $set: { role: "newsEditor" } }
      );
      return res.status(200).json({ message: "User updated to news editor" });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});
app.patch("/user/:id", async (req, res) => {
  const id = req.params.id;
  const params = req.params.email;
  const { profilePic, name, email } = req.body;

  try {
    const user = await UserModel.findByIdAndUpdate(
      { _id: id },
      { profilePic, name, email }
    );
    res.status(200).send({ message: "user is updated" });
  } catch (err) {
    console.log(err);
  }
});

module.exports = app;
