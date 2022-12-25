import jwt from "jsonwebtoken";
import { validationResult } from "express-validator";
import { MongoClient } from "mongodb";
import * as dotenv from "dotenv";
dotenv.config();

const mongoURL = process.env.DATABASE;

export const handleInputErrors = (req, res, next) => {
  try {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      res.status(400);
      res.json({ error: errors.array() });
    } else {
      next();
    }
  } catch (e) {
    console.log(e);
    res.json({ error: "500! Server Error" });
  }
};

export const protectSignIn = async (req, res, next) => {
  try {
    const { username, email } = req.body;

    let dbResult = {};

    const client = await MongoClient.connect(mongoURL, {
      useNewUrlParser: true,
    }).catch((err) => {
      throw err;
    });
    const db = await client.db("mydb");
    const connection = await db.collection("notVerifiedPeople");
    dbResult.user = await connection.findOne({
      $or: [{ username: username }, { email: email }],
    });

    if (!dbResult.user) {
      const connection2 = await db.collection("verifiedPeople");
      dbResult.user = await connection2.findOne({
        $or: [{ username: username }, { email: email }],
      });
    }

    if (!dbResult.user) {
      next();
    } else if (dbResult.error) {
      res.json({ error: "Database error" });
    } else {
      res.status(409);
      res.json({ error: "Username or Email Address already exist" });
    }
  } catch (e) {
    console.log(e);
    if (e.code && e.code === "ETIMEOUT") {
      res.status(504);
      res.json({ error: "Connection TimeOut" });
    } else {
      res.status(500);
      res.json({ error: "500! Server Error" });
    }
  }
};

export const protectLogIn = async (req, res, next) => {
  try {
    const { username, password } = JSON.parse(req.params.userInfo);
    let dbResult = {};

    const client = await MongoClient.connect(mongoURL, {
      useNewUrlParser: true,
    }).catch((err) => {
      dbResult.error = err;
      throw err;
    });

    const db = await client.db("mydb");
    const connection = await db.collection("verifiedPeople");

    dbResult.user = await connection.findOne(
      { $or: [{ username: username }, { email: username }] },
      {
        projection: {
          username: 1,
          firstname: 1,
          lastname: 1,
          password: 1,
          profileImage: 1,
          todos: 1,
        },
      }
    );

    if (dbResult.user) {
      next({
        username: username,
        password: password,
        databaseInfo: dbResult.user,
      });
    } else {
      res.status(400);
      res.json({ error: "Invalid Username or Email Address" });
    }
  } catch (e) {
    console.log(e);
    if (e.code && e.code === "ETIMEOUT") {
      res.status(504);
      res.json({ error: "Connection TimeOut" });
    } else {
      res.status(500);
      res.json({ error: "500! Server Error" });
    }
  }
};

export const protectForgotten = async (req, res, next) => {
  try {
    const username = req.body.username;
    const email = req.body.email;

    var dbResult = {};
    const client = await MongoClient.connect(mongoURL, {
      useNewUrlParser: true,
    }).catch((err) => {
      dbResult.error = err;
      throw err;
    });

    const db = await client.db("mydb");
    const connection = await db.collection("verifiedPeople");
    dbResult.user = await connection.findOne({ username: username });

    if (!dbResult.user) {
      dbResult.user = await connection.findOne({ email: username });
    }

    if (dbResult?.error) {
      res.json({ error: "Database error" });
    }

    if (dbResult.user && dbResult?.user?.email === email) {
      next(dbResult?.user);
    } else if (!dbResult?.user?.username) {
      res.status(400);
      res.json({ error: "Invalid Username" });
    } else {
      res.status(400);
      res.json({ error: "Invalid Email Address" });
    }
  } catch (e) {
    console.log(e);
    if (e.code && e.code === "ETIMEOUT") {
      res.status(504);
      res.json({ error: "Connection TimeOut" });
    } else {
      res.status(500);
      res.json({ error: "500! Server Error" });
    }
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
