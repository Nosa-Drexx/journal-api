import { hashPassword } from "./auth.js";
import { uniqueId } from "./functions.js";

export const defaultData = {
  todo: "Test: Nothing Written",
  id: 123,
  completed: false,
};

async function encrypt(password) {
  return hashPassword(password);
}

// const answer = encrypt("11111111");

// var data = {
//   nosaDrexx: {
//     id: uniqueId("nosaDrexx"),
//     username: "nosaDrexx",
//     password: await answer,
//     profileImage: true,
//     firstname: "Nosa",
//     lastname: "Egharevba",
//     email: "nosaegharevba01@gmail.com",
//     todos: [{ ...defaultData, date: new Date().toUTCString() }], // serving as fake database
//   },
// };

// export var tempData = {};

// export default data;
