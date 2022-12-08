import { hashPassword } from "./auth.js";
import { uniqueId } from "./functions.js";

export const defaultData = {
  todo: "Test: Nothing To Do",
  id: 123,
  completed: false,
};

async function encrypt(password) {
  return hashPassword(password);
}

const answer = encrypt("11111111");

var data = {
  nosaDrexx: {
    id: uniqueId("nosaDrexx"),
    username: "nosaDrexx",
    password: await answer,
    firstName: "Nosa",
    lastName: "Egharevba",
    email: "nosaegharevba01@gmail.com",
    todos: [defaultData], // serving as fake database
  },
};

export default data;
