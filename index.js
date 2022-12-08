import app from "./server.js";
import * as dotenv from "dotenv";
import config from "./config/index.js";
dotenv.config();

const PORT = config.port;

app.listen(PORT, () => {
  console.log(`hello from http://localhost:${PORT}`);
});
