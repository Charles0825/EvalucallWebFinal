const bcrypt = require("bcrypt");

const saltRounds = 10;

async function hashPassword(password) {
  try {
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    return hashedPassword;
  } catch (error) {
    throw new Error("Error hashing password: " + error.message);
  }
}

async function comparePasswords(enteredPassword, hashedPassword) {
  try {
    const result = await bcrypt.compare(enteredPassword, hashedPassword);
    return result;
  } catch (error) {
    throw new Error("Error comparing passwords");
  }
}

module.exports = { hashPassword, comparePasswords };
