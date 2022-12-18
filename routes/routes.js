import { Router } from "express";
import { body } from "express-validator";
import {
  deleteUser,
  getUserProfileImage,
  updateEmail,
  updateUserList,
  updateUsername,
  updateUserPassword,
  uploadImage,
} from "../handlers/handlers.js";
import { handleInputErrors, protectSignIn } from "../middleware.js";
import path from "path";
import multer from "multer";
import fs from "fs";
//For dirname and filename issues with nodejs modules.
/* */
import * as url from "url";
//const __filename = url.fileURLToPath(import.meta.url);
const __dirname = url.fileURLToPath(new URL(".", import.meta.url));
/* */

const router = Router();

router.put("/todo", body("todos").isArray(), handleInputErrors, updateUserList);

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const newPath = path.join(__dirname, "..", "user-profile");
    //Avoid duplicate user profile image
    const jpeg = fs.existsSync(`${path.join(newPath, req.user.username)}.jpeg`);
    const png = fs.existsSync(`${path.join(newPath, req.user.username)}.png`);
    const jpg = fs.existsSync(`${path.join(newPath, req.user.username)}.jpg`);
    if (jpeg || png || jpg) {
      if (jpeg) {
        fs.unlink(`${path.join(newPath, req.user.username)}.jpeg`, (err) => {
          if (err) {
            cb(null, null);
          }
        });
      }
      if (png) {
        fs.unlink(`${path.join(newPath, req.user.username)}.png`, (err) => {
          if (err) {
            cb(null, null);
          }
        });
      }
      if (jpg) {
        fs.unlink(`${path.join(newPath, req.user.username)}.jpg`, (err) => {
          if (err) {
            cb(null, null);
          }
        });
      }
    }
    ////
    cb(null, newPath);
  },
  filename: function (req, file, cb) {
    const ext = file.mimetype.slice(6, file.mimetype.length);
    cb(null, `${req.user.username}.${ext}`);
  },
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype == "image/png" ||
      file.mimetype == "image/jpg" ||
      file.mimetype == "image/jpeg"
    ) {
      cb(null, true);
    } else {
      req.mimetype = "bad";
      cb(null, false);
    }
  },
});

router.put("/uploadImage", upload.single("user-image"), uploadImage);

router.get("/userProfileImage", getUserProfileImage);

router.put(
  "/password",
  body("oldpassword").isString(),
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

router.delete("/delete", handleInputErrors, deleteUser);

router.use((err, req, res, next) => {
  console.log(err);
  if (err.type === "unauthorized") {
    res.status(401);
    res.json({ error: "unauthorized" });
  } else {
    res.status(500);
    res.json({ error: "in router handler error" });
  }
});

export default router;
