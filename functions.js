// import fetch from "node-fetch";

export const uniqueId = (username) => {
  const use = username || "_api";
  let result = `${use}_`;
  for (let i = 0; i < 10; i++) {
    const randomNo = Math.floor(Math.random() * 10);
    result += randomNo;
  }
  return result;
};

function randomNumberBetween(first, second) {
  if (typeof first !== "number" && typeof second !== "number")
    return "error expected type Number";
  const firstVal = Number(first);
  const secondVal = Number(second);
  const diff = Math.abs(firstVal - secondVal) - 1;

  const randomDiff = Math.floor(Math.random() * diff);
  const bigger = firstVal > secondVal ? firstVal - 1 : secondVal - 1;
  return Math.abs(bigger - randomDiff);
}

export const randomPasswordGen = () => {
  var use = "api-";
  for (let i = 0; i < 5; i++) {
    use += String.fromCharCode(randomNumberBetween(96, 123));
  }
  for (let i = 0; i < 5; i++) {
    const randomNo = Math.floor(Math.random() * 10);
    use += randomNo;
  }
  return use;
};

// export const resetForgottenPasswordRequest = async (
//   host,
//   username,
//   oldPassword
// ) => {
//   const dataOBJ = {
//     method: "PUT",
//     body: { username, password: oldPassword },
//   };
//   const reset = await fetch(`${host}/resetforgottenpasswordrequest`, dataOBJ);
//   const result = await reset.json();
//   return result;
// };
