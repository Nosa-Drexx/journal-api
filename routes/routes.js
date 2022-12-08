import e, { Router } from "express";
import { body } from "express-validator";
import {
  updateEmail,
  updateUserList,
  updateUsername,
  updateUserPassword,
} from "../handlers/handlers.js";
import { handleInputErrors, protectSignIn } from "../middleware.js";
// import app from "../server.js";

const router = Router();

router.put("/todo", body("todos").isArray(), handleInputErrors, updateUserList);

router.put(
  "/password",
  body("password").isString(),
  handleInputErrors,
  updateUserPassword
);

router.put(
  "/username",
  body("username").isString(),
  handleInputErrors,
  protectSignIn,
  updateUsername
);

router.put("/email", body("email").isString(), handleInputErrors, updateEmail);

router.use((err, req, res, next) => {
  console.log(err);
  if (err.type === "unauthorized") {
    res.status(401);
    res.json({ error: "unauthorized" });
  } else {
    res.json({ error: "in router handler error" });
  }
});

export default router;
