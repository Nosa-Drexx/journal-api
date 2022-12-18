import { randomPasswordGen, uniqueId, verifyId } from "../functions.js";
import { comparePassword, createWebToken, hashPassword } from "../auth.js";
import data, { defaultData, tempData } from "../fakeDatabase.js";
import nodemailer from "nodemailer";
import fs from "fs";
import path from "path";
//For dirname and filename issues with nodejs modules.
/* */
import * as url from "url";
//const __filename = url.fileURLToPath(import.meta.url);
const __dirname = url.fileURLToPath(new URL(".", import.meta.url));
/* */

export const createNewUser = async (req, res, next) => {
  try {
    const { username, password, email, firstname, lastname } = req.body;
    const emailId = verifyId();
    const newUserData = {
      id: uniqueId(username),
      username,
      password: await hashPassword(password),
      firstname,
      lastname,
      email,
      emailId: await hashPassword(emailId),
      profileImage: false,
      todos: [{ ...defaultData, date: new Date().toUTCString() }],
    };

    tempData[newUserData] = newUserData;

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
    const mailOptions = {
      from: process.env.EMAIL,
      to: email,
      subject: "Verify Email",
      html: `<h2>Verify Your Email Address</h2>
     <h1 style="text-align: center">${emailId}</h1>
     <p>This token becomes invalid after use</p>`,
    };
    await transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log(error);
        error.type = "invalid email";
        next(error);
      } else {
        res.json({ message: `Email sent: ${info.response}` });
      }
    });
  } catch (e) {
    e.type = "invalid input";
    console.log(e);
    next(e);
  }
};

export async function verifyNewUsers(req, res) {
  const reqEmailId = req.body.emailId;
  var validatePassword = false;
  var userData;

  for (let key in tempData) {
    const emailId = tempData[key].emailId;

    validatePassword = await comparePassword(reqEmailId, emailId);
    if (validatePassword) {
      userData = { ...tempData[key] };
      delete tempData[key];
      break;
    }
  }

  if (!validatePassword) {
    res.json({ error: "Invalid Email Token" });
  } else {
    data[userData.username] = userData; // add to db;
    const { email } = userData;
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
    const mailOptions = {
      from: process.env.EMAIL,
      to: email,
      subject: "Verifed",
      html: `<h2>You have been verifed</h2>
      <a href="http://${req.headers.origin}"> Click to Login</a>`,
    };
    await transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log(error);
        error.type = "invalid email";
        next(error);
      } else {
        res.json({ message: `Verifed` });
      }
    });
  }
}

export const getUserData = async (loginDetails, req, res, next) => {
  try {
    const { username, password } = loginDetails;

    const validatePassword = await comparePassword(
      password,
      data[username].password
    );

    if (validatePassword) {
      const user = data[username];
      const token = createWebToken(user);

      res.json({
        token,
        username: user.username,
        firstname: user.firstname,
        lastname: user.lastname,
        todos: user.todos,
        profileImage: user.profileImage,
      });
    } else {
      res.json({ error: "Incorrect Password" });
    }
  } catch (e) {
    e.type = "unauthorized";
    console.log(e);
    next(e);
  }
};

export const uploadImage = async (req, res, next) => {
  if (req.file) {
    data[req.user.username].profileImage = true;
    const { username, firstname, lastname, todos, profileImage } =
      data[req.user.username];
    res.json({
      message: "Image Updated",
      userData: { username, firstname, lastname, todos, profileImage },
    });
  } else if (req.mimetype) {
    res.status(400);
    res.json({
      error: "Only images with .png, .jpg and .jpeg format allowed!",
    });
  } else {
    next();
  }
};

export const getUserProfileImage = async (req, res, next) => {
  let stream;
  const newPath = path.join(__dirname, "..", "user-profile");
  if (data[req.user.username].profileImage) {
    const jpeg = fs.existsSync(`${path.join(newPath, req.user.username)}.jpeg`);
    const png = fs.existsSync(`${path.join(newPath, req.user.username)}.png`);
    const jpg = fs.existsSync(`${path.join(newPath, req.user.username)}.jpg`);

    if (!jpeg && !png && !jpg) {
      data[req.user.username].profileImage = false;
      // const { username, firstname, lastname, todos, profileImage } =
      //   data[req.user.username];
      stream = fs.createReadStream(
        `${path.join(newPath, "api_blank_photo")}.png`
      );
      stream.on("open", () => {
        stream.pipe(res);
      });
      stream.on("error", (e) => {
        next(e);
      });
      // res.json({
      //   error: "Couldn't find profile image",
      //   userData: { username, firstname, lastname, todos, profileImage },
      // });
    }

    if (jpeg) {
      stream = fs.createReadStream(
        `${path.join(newPath, req.user.username)}.jpeg`
      );
    }
    if (png) {
      stream = fs.createReadStream(
        `${path.join(newPath, req.user.username)}.png`
      );
    }
    if (jpg) {
      stream = fs.createReadStream(
        `${path.join(newPath, req.user.username)}.jpg`
      );
    }
    stream.on("open", () => {
      stream.pipe(res);
    });
    stream.on("error", (e) => {
      next(e);
    });
  } else {
    console.log("hi");
    stream = fs.createReadStream(
      `${path.join(newPath, "api_blank_photo")}.png`
    );
    stream.on("open", () => {
      stream.pipe(res);
    });
    stream.on("error", (e) => {
      next(e);
    });
  }
};

export const updateUserList = (req, res, next) => {
  try {
    const incomingData = req.user;
    const user = data[incomingData.username];
    user.todos = req.body.todos;
    res.json({ todos: user.todos });
  } catch (e) {
    e.type = "unauthorized";
    console.log(e);
    next(e);
  }
};

export const updateUserPassword = async (req, res, next) => {
  try {
    const incomingData = req.user;
    const oldPassword = req.body.oldpassword;
    const user = data[incomingData.username];
    const checkOldPassword = await comparePassword(oldPassword, user.password);
    if (checkOldPassword) {
      const newPassword = await hashPassword(req.body.password);
      user.password = newPassword;
      const token = createWebToken(user);
      res.json({ message: "Password Updated", token });
    } else {
      res.status(400);
      res.json({ error: "invalid old password" });
    }
  } catch (e) {
    e.type = "unauthorized";
    console.log(e);
    next(e);
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    const requestingUser = req.user;
    delete data[requestingUser.username];
    res.json({ message: `${requestingUser.username} deleted` });
  } catch (e) {
    console.log(e);
    next(e);
  }
};

export const updateUsername = async (req, res, next) => {
  try {
    const newUsername = req.body.username;
    const incomingData = req.user;
    const user = data[incomingData.username];
    const { username, ...details } = user;
    data[newUsername] = { username: newUsername, ...details };
    delete data[username];

    const token = createWebToken(data[newUsername]);

    res.json({
      token,
      username: newUsername,
      message: `Username Updated ${newUsername}`,
    });
  } catch (e) {
    e.type = "unauthorized";
    console.log(e);
    next(e);
  }
};

export const forgottenPassword = async (req, res, next) => {
  try {
    const newPassword = await randomPasswordGen();
    const incomingData = req.body;
    const user = data[incomingData.username];
    const oldPassword = user.password;
    const hashNewPassword = await hashPassword(newPassword);
    user.password = hashNewPassword;
    // const token = createWebToken(user);

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
    const mailOptions = {
      from: process.env.EMAIL,
      to: user.email,
      subject: "Password request",
      html: `<h2>Request New Password</h2><h1 style="text-align: center;">${newPassword}</h1>
      <a href=${req.headers.origin}>click here to return to website</a><br />`,
    };
    await transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log(error);
        error.type = "invalid email";
        next(error);
      } else {
        res.json({ message: `Email sent: ${info.response}` });
      }
    });
  } catch (e) {
    console.log(e);
    next(e);
  }
};

export const updateEmail = (req, res, next) => {
  try {
    const newEmail = req.body.email;
    const incomingData = req.user;
    const user = data[incomingData.username];
    user.email = newEmail;
    res.json({ message: `email updated ${newEmail}` });
  } catch (e) {
    console.log(e);
    next(e);
  }
};

export const handleResetForgottenPass = (req, res, next) => {
  try {
    const { username, password } = req.params.data;
    const user = data[username];
    user.password = password;
    res.end();
  } catch (e) {
    console.log(e);
    next(e);
  }
};
