// models/Admin.js

const executeQuery = require("../modules/db");
const { hashPassword, comparePasswords } = require("../modules/bcrypt");
const fs = require("fs");
const path = require("path");
// Function to create the Admin model
function Admin(
  id,
  first_name,
  last_name,
  email,
  password,
  resetPasswordToken,
  resetPasswordExpires,
  profilePicturePath
) {
  this.id = id;
  this.first_name = first_name;
  this.last_name = last_name;
  this.email = email;
  this.password = password;
  this.resetPasswordToken = resetPasswordToken;
  this.resetPasswordExpires = resetPasswordExpires;
  this.profilePicturePath = profilePicturePath;
}

// Function to save a new admin to the database
Admin.prototype.save = async function (callback) {
  try {
    // Hash the password
    const hashedPassword = await hashPassword(this.password);

    // Save the hashed password and profile picture path to the database
    const query = `INSERT INTO admin_accounts (id, first_name, last_name, email, password, resetPasswordToken, resetPasswordExpires, profilePicturePath) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
    const values = [
      this.id,
      this.first_name,
      this.last_name,
      this.email,
      hashedPassword,
      this.resetPasswordToken,
      this.resetPasswordExpires,
      this.profilePicturePath,
    ];
    executeQuery(query, values, callback);
  } catch (error) {
    throw new Error("Error saving admin: " + error.message);
  }
};

// Function to upload profile picture
Admin.prototype.uploadProfilePicture = async function (file) {
  try {
    // Ensure uploads directory exists
    const uploadsDir = path.join(__dirname, "..", "uploads");
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir);
    }

    // Generate unique filename
    const filename = Date.now() + "-" + file.originalname;
    const filePath = path.join(uploadsDir, filename);

    // Write file to disk
    await fs.promises.writeFile(filePath, file.buffer);

    // Set profile picture path
    this.profilePicturePath = filePath;

    return filePath; // Return file path for further processing
  } catch (error) {
    throw new Error("Error uploading profile picture: " + error.message);
  }
};

// Function to find an admin by email
Admin.findByEmail = async function (email, callback) {
  try {
    const query = `SELECT * FROM admin_accounts WHERE email = ?`;
    const values = [email];
    executeQuery(query, values, (err, result) => {
      if (err) {
        callback(err, null);
        return;
      }

      if (result.length === 0) {
        callback(null, null); // Admin not found
      } else {
        const adminData = result[0];
        const admin = new Admin(
          adminData.id,
          adminData.first_name,
          adminData.last_name,
          adminData.email,
          adminData.password,
          adminData.resetPasswordToken,
          adminData.resetPasswordExpires,
          adminData.profilePicturePath
        );
        callback(null, admin);
      }
    });
  } catch (error) {
    throw new Error("Error finding admin by email: " + error.message);
  }
};

// Function to find an admin by ID
Admin.findById = async function (id, callback) {
  try {
    const query = `SELECT * FROM admin_accounts WHERE id = ?`;
    const values = [id];
    executeQuery(query, values, (err, result) => {
      if (err) {
        callback(err, null);
        return;
      }

      if (result.length === 0) {
        callback(null, null); // Admin not found
      } else {
        const adminData = result[0];
        const admin = new Admin(
          adminData.id,
          adminData.first_name,
          adminData.last_name,
          adminData.email,
          adminData.password,
          adminData.resetPasswordToken,
          adminData.resetPasswordExpires,
          adminData.profilePicturePath
        );
        callback(null, admin);
      }
    });
  } catch (error) {
    throw new Error("Error finding admin by ID: " + error.message);
  }
};

// Function to verify admin credentials
Admin.verifyCredentials = async function (email, password, callback) {
  try {
    // Find the admin by email
    Admin.findByEmail(email, async (err, admin) => {
      if (err) {
        callback(err, null);
        return;
      }

      if (!admin) {
        callback(null, false); // Admin not found
        return;
      }
      // Compare the passwords
      const passwordsMatch = await comparePasswords(password, admin.password);
      callback(null, passwordsMatch);
    });
  } catch (error) {
    throw new Error("Error verifying admin credentials: " + error.message);
  }
};

module.exports = Admin;
