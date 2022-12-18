import jwt from "jsonwebtoken";
import data, { tempData } from "./fakeDatabase.js";
import { validationResult } from "express-validator";

export const handleInputErrors = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    res.status(400);
    res.json({ error: errors.array() });
  } else {
    next();
  }
};

export const protectSignIn = (req, res, next) => {
  const { username } = req.body;

  if (!data[username] && !tempData[username]) {
    next();
  } else {
    res.status(409);
    res.json({ error: "Username already exist" });
  }
};

export const protectLogIn = (req, res, next) => {
  const { username, email, password } = JSON.parse(req.params.userInfo);

  if (username && data[username]) {
    next({ username: username, password: password });
  } else if (email) {
    let userData;
    for (let key in data) {
      if (data[key].email === email) {
        userData = data[key].username;
        break;
      }
    }
    next({ username: userData, password: password });
  } else {
    res.status(400);
    res.json({ error: "Invalid Username or Email Address" });
  }
};

export const protectForgotten = (req, res, next) => {
  const username = req.body.username;
  const email = req.body.email;

  if (data[username] && data[username].email === email) {
    next();
  } else if (!data[username]) {
    res.status(400);
    res.json({ error: "Invalid Username" });
  } else {
    res.status(400);
    res.json({ error: "Invalid Email Address" });
  }
};

export const protect = (req, res, next) => {
  const bearer = req.headers.authorization;

  if (!bearer) {
    res.status(401);
    res.json({ error: "not-authorized" });
    return;
  }

  const [, token] = bearer.split(" ");

  if (!token) {
    res.status(401);
    res.json({ error: "not valid token" });
    return;
  }

  try {
    const user = jwt.verify(token, process.env.JWT_SECRET);
    req.user = user;
    next();
  } catch (e) {
    console.log(e);
    res.status(401);
    res.json({ error: "not-authorized" });
  }
};

// export const updateTodo = (req, res, next) => {
//   if (req.body.todos && Array.isArray(req.body.todos)) {
//     next();
//   } else {
//     res.json({ error: "no todo list" });
//   }
// };
