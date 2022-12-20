import merge from "lodash.merge";
import local from "./development.js";
import production from "./production.js";

process.env.NODE_ENV = process.env.NODE_ENV || "development";

let stage = process.env.STAGE || "local";

let envConfig;

if (stage === "production") {
  envConfig = production;
} else {
  envConfig = local;
}

export default merge(
  {
    stage,
    env: process.env.NODE_ENV,
    port: 8080,
    secrets: {
      jwt: process.env.JWT_SECRET,
      email: process.env.EMAIL,
      email_password: process.env.EMAIL_PASSWORD,
      database: process.env.DATABASE,
    },
  },
  envConfig
);
