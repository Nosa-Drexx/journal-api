import * as bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export const createWebToken = (user) => {
  const { id, username, password } = user;
  const token = jwt.sign({ id, username, password }, process.env.JWT_SECRET);
  return token;
};

export const hashPassword = (password) => {
  return bcrypt.hash(password, 5);
};

export const comparePassword = (password, hash) => {
  return bcrypt.compare(password, hash);
};
