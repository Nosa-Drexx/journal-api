import { randomPasswordGen, uniqueId, verifyId } from "../functions.js";
import { comparePassword, createWebToken, hashPassword } from "../auth.js";
import { defaultData } from "../fakeDatabase.js";
import nodemailer from "nodemailer";
import fs from "fs";
import path from "path";
//For dirname and filename issues with nodejs modules.
/* */
import * as url from "url";
//const __filename = url.fileURLToPath(import.meta.url);
const __dirname = url.fileURLToPath(new URL(".", import.meta.url));
/* */
import { MongoClient } from "mongodb";
import * as dotenv from "dotenv";
dotenv.config();

const mongoURL = process.env.DATABASE;

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
      emailId: emailId,
      profileImage: false,
      todos: [{ ...defaultData, date: new Date().toUTCString() }],
    };

    var dbResult = {};

    const client = await MongoClient.connect(mongoURL, {
      useNewUrlParser: true,
    }).catch((err) => {
      dbResult.error = err;
      throw err;
    });

    const db = await client.db("mydb");
    const connection = await db.collection("notVerifiedPeople");
    await connection.insertOne(newUserData);

    if (dbResult?.error) {
      var e = {};
      e.type = "database";
      next(e);
    }
    // tempData[newUserData] = newUserData;

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
      html: `<h1 style="text-align: center">JourNal</h1>
      <h2>Verify Your Email Address</h2>
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
  try {
    const reqEmailId = req.body.emailId;

    let dbResult = {};

    const client = await MongoClient.connect(mongoURL, {
      useNewUrlParser: true,
    }).catch((err) => {
      dbResult.error = err;
      throw err;
    });

    const db = await client.db("mydb");
    const connection = await db.collection("notVerifiedPeople");
    dbResult.user = await connection.findOne({ emailId: reqEmailId });

    if (dbResult.user) {
      const connection2 = await db.collection("verifiedPeople");

      await connection2.insertOne(dbResult.user);

      await connection.deleteOne({ emailId: reqEmailId });
    }

    if (dbResult?.error) {
      var e = {};
      e.type = "database";
      next(e);
    }

    if (!dbResult?.user?.username) {
      res.json({ error: "Invalid Email Token" });
    } else {
      const { email } = dbResult.user;
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
        html: `<h1 style="text-align: center">JourNal</h1>
      <h2>You have been verifed</h2>
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
  } catch (e) {
    console.log(e);
    next(e);
  }
}

export const getUserData = async (loginDetails, req, res, next) => {
  try {
    const { username, password, databaseInfo } = loginDetails;

    const validatePassword = await comparePassword(
      password,
      databaseInfo.password
    );

    if (validatePassword) {
      const user = databaseInfo;
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
  try {
    if (req.file) {
      var dbResult = {};
      const newvalues = { $set: { profileImage: true } };
      const client = await MongoClient.connect(mongoURL, {
        useNewUrlParser: true,
      }).catch((err) => {
        dbResult.error = err;
        throw err;
      });

      const db = await client.db("mydb");
      const connection = await db.collection("verifiedPeople");
      await connection.updateOne({ username: req.user.username }, newvalues);

      dbResult.user = await connection.findOne(
        { username: req.user.username },
        {
          projection: {
            username: 1,
            firstname: 1,
            lastname: 1,
            todos: 1,
            profileImage: 1,
          },
        }
      );
      if (dbResult.user) {
        res.json({
          message: "Image Updated",
          userData: dbResult?.user,
        });
      }
    } else if (req.mimetype) {
      res.status(400);
      res.json({
        error: "Only images with .png, .jpg and .jpeg format allowed!",
      });
    } else {
      next();
    }
  } catch (e) {
    console.log(e);
    next(e);
  }
};

export const getUserProfileImage = async (req, res, next) => {
  try {
    let stream;
    const newPath = path.join(__dirname, "..", "user-profile");
    var dbResult = {};
    const client = await MongoClient.connect(mongoURL, {
      useNewUrlParser: true,
    }).catch((err) => {
      dbResult.error = err;
      throw err;
    });

    const db = await client.db("mydb");
    const connection = await db.collection("verifiedPeople");
    dbResult.user = await connection.findOne(
      { username: req.user.username },
      {
        projection: {
          profileImage: 1,
        },
      }
    );

    if (dbResult?.error) {
      var e = {};
      e.type = "database";
      next(e);
    }
    if (dbResult.user) {
      const jpeg = fs.existsSync(
        `${path.join(newPath, req.user.username)}.jpeg`
      );
      const png = fs.existsSync(`${path.join(newPath, req.user.username)}.png`);
      const jpg = fs.existsSync(`${path.join(newPath, req.user.username)}.jpg`);

      if (!jpeg && !png && !jpg) {
        var dbResult = {};
        const newvalues = { $set: { profileImage: false } };

        dbResult.user = await connection.updateOne(
          { username: req.user.username },
          newvalues
        );

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
  } catch (e) {
    console.log(e);
    next(e);
  }
};

export const updateUserList = async (req, res, next) => {
  try {
    const incomingData = req.user;
    const newvalues = { $set: { todos: req.body.todos } };
    var dbResult = {};
    const client = await MongoClient.connect(mongoURL, {
      useNewUrlParser: true,
    }).catch((err) => {
      dbResult.error = err;
      throw err;
    });

    const db = await client.db("mydb");
    const connection = await db.collection("verifiedPeople");
    await connection.updateOne({ username: incomingData.username }, newvalues);

    if (dbResult.error) {
      e = {};
      e.type = "database";
      next(e);
    }

    if (!dbResult.error) {
      dbResult.user = await connection.findOne(
        {
          username: incomingData.username,
        },
        { projection: { todos: 1 } }
      );

      res.json({ todos: dbResult.user.todos });
    }
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

    var dbResult = {};
    //Get all User data
    const client = await MongoClient.connect(mongoURL, {
      useNewUrlParser: true,
    }).catch((err) => {
      dbResult.error = err;
      throw err;
    });
    const db = await client.db("mydb");
    const connection = await db.collection("verifiedPeople");
    dbResult.user = await connection.findOne({
      username: incomingData.username,
    });

    var checkOldPassword;
    if (dbResult.user.password) {
      checkOldPassword = await comparePassword(
        oldPassword,
        dbResult.user.password
      );
    } else {
      var e = {};
      e.type = "database";
      next(e);
    }
    if (checkOldPassword) {
      const newPassword = await hashPassword(req.body.password);
      const newvalues = { $set: { password: newPassword } };

      //Update user password
      await connection.updateOne(
        { username: incomingData.username },
        newvalues
      );

      if (dbResult.error) {
        var e = {};
        e.type = "database";
        next(e);
      } else {
        const token = createWebToken(dbResult.user);
        res.json({ message: "Password Updated", token });
      }
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
    const incomingData = req.user;
    var dbResult = {};
    const newPath = path.join(__dirname, "..", "user-profile");
    const client = await MongoClient.connect(mongoURL, {
      useNewUrlParser: true,
    }).catch((err) => {
      dbResult.error = err;
      throw err;
    });

    const db = await client.db("mydb");
    const connection = await db.collection("verifiedPeople");
    await connection.deleteOne({
      username: incomingData.username,
    });

    if (dbResult.error) {
      var e = {};
      e.type = "database";
      next(e);
    }

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

    res.json({ message: `${incomingData.username} deleted` });
  } catch (e) {
    console.log(e);
    next(e);
  }
};

export const updateUsername = async (req, res, next) => {
  try {
    const newUsername = req.body.username;
    const incomingData = req.user;
    const newvalues = { $set: { username: newUsername } };

    var dbResult = {};

    const client = await MongoClient.connect(mongoURL, {
      useNewUrlParser: true,
    }).catch((err) => {
      dbResult.error = err;
      throw err;
    });

    const db = await client.db("mydb");
    const connection = await db.collection("verifiedPeople");
    dbResult.user = await connection.findOne(
      {
        username: newUsername,
      },
      { projection: { username: 1, password: 1, id: 1 } }
    );
    if (!dbResult.user) {
      await connection.updateOne(
        { username: incomingData.username },
        newvalues
      );
    } else {
      var e = {};
      e.type = "username";
      next(e);
    }

    if (dbResult.error) {
      var e = {};
      e.type = "database";
      next(e);
    }

    if (!dbResult.error) {
      dbResult.user = await connection.findOne(
        {
          username: newUsername,
        },
        { projection: { username: 1, password: 1, id: 1 } }
      );

      const token = createWebToken(dbResult.user);

      res.json({
        token,
        username: newUsername,
        message: `Username Updated ${newUsername}`,
      });
    }
  } catch (e) {
    e.type = "unauthorized";

    console.log(e);
    next(e);
  }
};

export const forgottenPassword = async (userDetails, req, res, next) => {
  try {
    const newPassword = await randomPasswordGen();
    const incomingData = req.body;
    const oldPassword = userDetails.password;
    const hashNewPassword = await hashPassword(newPassword);

    const newvalues = { $set: { password: hashNewPassword } };

    var dbResult = {};

    const client = await MongoClient.connect(mongoURL, {
      useNewUrlParser: true,
    }).catch((err) => {
      dbResult.error = err;
      throw err;
    });

    const db = await client.db("mydb");
    const connection = await db.collection("verifiedPeople");
    await connection.updateOne({ username: userDetails.username }, newvalues);

    if (dbResult.error) {
      var e = {};
      e.type = "database";
      next(e);
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
    const mailOptions = {
      from: process.env.EMAIL,
      to: userDetails.email,
      subject: "Password request",
      html: `<h1 style="text-align: center">JourNal</h1>
      <h2>New Password</h2><h1 style="text-align: center;">${newPassword}</h1>
      <a href=${req.headers.origin}>click here to return to website</a><br />`,
    };
    await transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log(error);
        error.type = "invalid email";
        next(error);
      } else {
        res.json({ message: `Email sent` });
      }
    });
  } catch (e) {
    console.log(e);
    next(e);
  }
};

export const updateEmail = async (req, res, next) => {
  try {
    const newEmail = req.body.email;
    const incomingData = req.user;
    const newvalues = { $set: { email: newEmail } };

    var dbResult = {};

    const client = await MongoClient.connect(mongoURL, {
      useNewUrlParser: true,
    }).catch((err) => {
      dbResult.error = err;
      throw err;
    });

    const db = await client.db("mydb");
    const connection = await db.collection("verifiedPeople");
    await connection.updateOne({ username: incomingData.username }, newvalues);

    if (dbResult.error) {
      var e = {};
      e.type = "database";
      next(e);
    }

    res.json({ message: `email updated ${newEmail}` });
  } catch (e) {
    console.log(e);
    next(e);
  }
};
