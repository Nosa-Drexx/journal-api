import express from "express";
import morgan from "morgan";
import cors from "cors";
import {
  handleInputErrors,
  protect,
  protectForgotten,
  protectLogIn,
  protectSignIn,
} from "./middleware.js";
import {
  createNewUser,
  forgottenPassword,
  getUserData,
  verifyNewUsers,
} from "./handlers/handlers.js";
import { body } from "express-validator";
import router from "./routes/routes.js";

const app = express();

app.use(cors());
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res, next) => {
  try {
    res.json({ message: "Welcome to our server at JourNal" });
  } catch (e) {
    console.log(e);
    next(e);
  }
});

app.post(
  "/newUser",
  body("username").isString(),
  body("password").isString(),
  body("email").isString(),
  body("firstname").isString(),
  body("lastname").isString(),
  handleInputErrors,
  protectSignIn,
  createNewUser
);
app.post("/verifyNewUser", body("emailId").isString(), verifyNewUsers);

app.use("/update", protect, router);

app.get("/getData/:userInfo", protectLogIn, getUserData);

app.put(
  "/forgottenPass",
  body("username").isString(),
  body("email").isString(),
  handleInputErrors,
  protectForgotten,
  forgottenPassword
);

app.use((err, req, res, next) => {
  if (err.code && err.code === "ETIMEOUT") {
    res.status(504);
    res.json({ error: "Connection TimeOut" });
  } else if (err.type === "unauthorized") {
    res.status(401);
    res.json({ error: "unauthorized" });
  } else if (err.type === "input") {
    res.status(400);
    res.json({ error: "invalid input" });
  } else if ((err.type = "invalid email")) {
    res.status(400);
    res.json({ error: "Invalid Email Address" });
  } else if (err.type === "database") {
    res.status(500);
    res.json({ error: "Database error" });
  } else {
    res.status(500);
    console.log(err);
    res.json({ error: "That's on us" });
  }
});

export default app;
