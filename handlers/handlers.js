import { randomPasswordGen, uniqueId } from "../functions.js";
import { comparePassword, createWebToken, hashPassword } from "../auth.js";
import data, { defaultData } from "../fakeDatabase.js";
import nodemailer from "nodemailer";
import e from "express";

export const createNewUser = async (req, res, next) => {
  // res.header({
  //   "Access-Control-Allow-Origin": "*",
  // });
  // res.header({
  //   "Access-Control-Allow-Headers": "*",
  // });
  try {
    const { username, password, email, firstname, lastname } = req.body;
    const newUserData = {
      id: uniqueId(username),
      username,
      password: await hashPassword(password),
      firstname,
      lastname,
      email,
      todos: [defaultData],
    };

    data[newUserData.username] = newUserData;

    const token = createWebToken(newUserData);

    res.json({ token });
  } catch (e) {
    e.type = "invalid input";
    console.log(e);
    next(e);
  }
};

export const getUserData = async (req, res, next) => {
  // res.header({
  //   "Access-Control-Allow-Origin": "*",
  // });
  // res.header({
  //   "Access-Control-Allow-Headers": "*",
  // });
  try {
    const { username, password } = JSON.parse(req.params.userInfo);

    const validatePassword = await comparePassword(
      password,
      data[username].password
    );

    if (validatePassword) {
      const user = data[username];
      const token = createWebToken(user);

      res.json({ token, username: user.username, todos: user.todos });
    } else {
      res.json({ error: "Incorrect Password" });
    }
  } catch (e) {
    e.type = "unauthorized";
    console.log(e);
    next(e);
  }
};

export const updateUserList = (req, res, next) => {
  //   res.header({
  //     "Access-Control-Allow-Origin": "*",
  //   });
  //   res.header({
  //     "Access-Control-Allow-Headers": "*",
  //   });
  try {
    const incomingData = req.user;
    const user = data[incomingData.username];
    user.todos = [...req.body.todos];
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
    const user = data[incomingData.username];
    const newPassword = await hashPassword(req.body.password);
    user.password = newPassword;
    const token = createWebToken(user);
    res.json({ token });
  } catch (e) {
    e.type = "unauthorized";
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

    res.json({ token });
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
    res.json({ message: true });
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
