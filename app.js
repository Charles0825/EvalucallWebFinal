const express = require("express");
const bodyParser = require("body-parser");
const session = require("express-session");
const bcrypt = require("bcrypt");
const { connection } = require("./modules/db");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const multer = require("multer");
const Admin = require("./models/admin");
const app = express();
const PORT = 2525;
const path = require("path");
// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(
  session({
    secret: "secret",
    resave: true,
    saveUninitialized: true,
  })
);
app.use("/public", express.static("public"));

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + "-" + Date.now());
  },
});

const upload = multer({ storage: storage });

app.use("/uploads", express.static("uploads"));

const mailTransporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "evalucallsystem@gmail.com",
    pass: "bmih asgr ltvt iqzr",
  },
});

function generateResetToken() {
  return crypto.randomBytes(20).toString("hex");
}

// const nocache = (req, res, next) => {
//   res.header("Cache-Control", "private, no-cache, no-store, must-revalidate");
//   res.header("Expires", "-1");
//   res.header("Pragma", "no-cache");
//   next();
// };

// app.use(nocache);

const isAuthenticated = (req, res, next) => {
  if (req.session.loggedin) {
    // If user is authenticated, proceed to the next middleware
    next();
  } else {
    // If user is not authenticated, redirect to the login page
    //res.redirect("/login");
    next();
  }
};

app.post(
  "/update-account-settings",
  upload.single("updateProfile"),
  (req, res) => {
    const adminId = req.session.adminId;

    // Extracting fields from the request body
    const { firstName, lastName, email, currentPass, newPass, confirmPass } =
      req.body;

    console.log(firstName);
    console.log(lastName);
    console.log(email);
    console.log(currentPass);
    console.log(newPass);
    console.log(confirmPass);

    // If profile picture is uploaded, update the profile picture path
    let profilePicturePath = "";
    if (req.file) {
      profilePicturePath = req.file.path;
      console.log(profilePicturePath);
    } else {
      console.log("No file uploaded.");
    }

    // Updating the admin account information
    const updateFields = [];
    const updateValues = [];

    if (firstName !== undefined && firstName !== "") {
      updateFields.push("first_name = ?");
      updateValues.push(firstName);
    }
    if (lastName !== undefined && lastName !== "") {
      updateFields.push("last_name = ?");
      updateValues.push(lastName);
    }
    if (email !== undefined && email !== "") {
      updateFields.push("email = ?");
      updateValues.push(email);
    }
    if (profilePicturePath !== "") {
      updateFields.push("profilePicturePath = ?");
      updateValues.push(profilePicturePath);
    }
    console.log(updateFields);
    console.log(updateValues);
    // Only proceed with password change if currentPass is provided
    if (currentPass && newPass && confirmPass) {
      // Fetch the hashed password from the database
      connection.query(
        "SELECT password FROM admin_accounts WHERE id = ?",
        [adminId],
        (err, results) => {
          if (err) {
            console.error(err);
            return res.json({
              message: "Internal Server Error",
            });
          }
          if (results.length === 0) {
            return res.json({
              message: "Admin account not found",
            });
          }

          const hashedPassword = results[0].password;

          // Check if newPass and confirmPass match
          if (newPass !== confirmPass) {
            return res.json({
              message: "New password and confirm password do not match",
            });
          }

          bcrypt.compare(currentPass, hashedPassword, async (err, isMatch) => {
            if (err) {
              console.error(err);
              return res.json({
                message: "Internal Server Error",
              });
            }

            if (!isMatch) {
              return res.json({
                message: "Current password is incorrect",
              });
            }

            const hashedNewPass = await hashPassword(newPass);
            updateFields.push("password = ?");
            updateValues.push(hashedNewPass);

            updateAccount(
              res,
              adminId,
              updateFields,
              updateValues,
              "Account settings updated successfully"
            );
          });
        }
      );
    } else {
      // If no password change, update other fields
      if (updateFields.length === 0) {
        return res.json({
          message: "No fields provided for update",
        });
      }
      updateAccount(
        res,
        adminId,
        updateFields,
        updateValues,
        "Account settings updated successfully"
      );
    }
  }
);

async function updateAccount(
  res,
  adminId,
  updateFields,
  updateValues,
  message
) {
  // Adding adminId to the values array
  updateValues.push(adminId);

  // Constructing the query
  const query = `UPDATE admin_accounts SET ${updateFields.join(
    ", "
  )} WHERE id = ?`;

  // Executing the query
  connection.query(query, updateValues, (err, results) => {
    if (err) {
      console.error(err);
      return res.json({
        message: "Internal Server Error",
      });
    }
    return res.json({
      message: message,
    });
  });
}

async function hashPassword(password) {
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    return hashedPassword;
  } catch (error) {
    throw error;
  }
}

app.get("/get-account-settings", (req, res) => {
  const adminId = req.session.adminId;

  if (!adminId) {
    return res
      .status(401)
      .json({ message: "Unauthorized: No admin ID found in session." });
  }

  const query =
    "SELECT first_name, last_name, email, profilePicturePath FROM admin_accounts WHERE id = ?";

  connection.query(query, [adminId], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Internal Server Error" });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: "Admin account not found" });
    }

    // Sending back the retrieved information
    const { first_name, last_name, email, profilePicturePath } = results[0];
    res.status(200).json({
      firstName: first_name,
      lastName: last_name,
      email: email,
      profilePicturePath: profilePicturePath,
    });
  });
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "homepage.html"));
});
app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "login.html"));
});

app.post("/login", (req, res) => {
  const { email, password } = req.body;
  console.log(email);
  console.log(password);
  connection.query(
    "SELECT id, email, password FROM admin_accounts WHERE email = ?",
    [email],
    async (err, results) => {
      if (err) {
        res
          .status(500)
          .json({ success: false, message: "Error in database operation." });
        res.redirect("/");
      } else if (results.length > 0) {
        const comparison = await bcrypt.compare(password, results[0].password);
        if (comparison) {
          req.session.adminId = results[0].id;
          req.session.loggedin = true;
          req.session.email = email;
          res.json({
            success: true,
            message: "Login successful.",
            redirect: "/dashboard",
          });
        } else {
          res.json({
            success: false,
            message: "Incorrect email or password!",
          });
        }
      } else {
        res
          .status(401)
          .json({ success: false, message: "Incorrect email or password!" });
      }
    }
  );
});

app.get("/register", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "register.html"));
});

app.post("/register", async (req, res) => {
  const { firstName, lastName, email, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);

  connection.query(
    "INSERT INTO admin_accounts (first_name, last_name, email, password) VALUES (?, ?, ?, ?)",
    [firstName, lastName, email, hashedPassword],
    (err, results) => {
      if (err) {
        if (err.code === "ER_DUP_ENTRY") {
          // Duplicate entry error, email already exists
          res.json({
            message: "Email already exists.",
          });
        } else {
          // Other errors
          console.error(err);
          res.json({
            message: "An error occurred during registration.",
          });
        }
      } else {
        // No error, registration successful
        res.json({
          success: true,
          message: "Registration successful! Please log in.",
        });
      }
    }
  );
});

function generateRandomPassword(length) {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let password = "";
  for (let i = 0; i < length; i++) {
    password += characters.charAt(
      Math.floor(Math.random() * characters.length)
    );
  }
  return password;
}

app.post("/register-agent", async (req, res) => {
  const { firstName, lastName, email } = req.body;

  try {
    // Generate a random password
    const randomPassword = generateRandomPassword(10);

    // Hash the random password
    const hashedPassword = await bcrypt.hash(randomPassword, 10);

    // Get the current datetime
    const createdAt = new Date();

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "evalucallsystem@gmail.com",
        pass: "bmih asgr ltvt iqzr",
      },
    });

    const mailOptions = {
      from: "evalucallsystem@gmail.com",
      to: email,
      subject: "Your Account Password",
      text: `Hello ${firstName} ${lastName},\n\nYour account password is: ${randomPassword}\n\nPlease change your password after logging in for security reasons.`,
    };

    try {
      // Send email
      await transporter.sendMail(mailOptions);

      // Insert the agent data into the database
      connection.query(
        "INSERT INTO agent_accounts (first_name, last_name, email, password, DateCreated) VALUES (?, ?, ?, ?, ?)",
        [firstName, lastName, email, hashedPassword, createdAt],
        (err, results) => {
          if (err) {
            res.json({
              message: "Email already exists or invalid data.",
            });
          } else {
            res.json({
              message: "Agent registration successful! Password sent to email.",
            });
          }
        }
      );
    } catch (error) {
      console.log(error);
      res.json({
        message: "Failed to send email with password.",
      });
    }
  } catch (error) {
    console.log(error);
    res.json({
      message: "Failed to generate password.",
    });
  }
});

app.get("/forgot-password", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "login.html"));
});

app.post("/forgot-password", (req, res) => {
  const { email } = req.body;
  console.log(email);
  const resetToken = generateResetToken();
  const expirationTime = new Date(Date.now() + 3600000);
  const resetLink = `http://localhost:${PORT}/reset-password?token=${resetToken}`;

  connection.query(
    "UPDATE admin_accounts SET resetPasswordToken = ?, resetPasswordExpires = ? WHERE email = ?",
    [resetToken, expirationTime, email],
    async (err, results) => {
      if (err || results.affectedRows === 0) {
        res.json({
          message: "Email not found.",
        });
        //res.redirect("/forgot-password");
      } else {
        await sendResetEmail(email, resetLink);
        res.json({
          message: "Reset password link sent to your email.",
        });
        //res.redirect("/forgot-password");
      }
    }
  );
});

async function sendResetEmail(email, link) {
  const mailOptions = {
    from: "yourgmail@gmail.com",
    to: email,
    subject: "Password Reset",
    html: `<p>To reset your password, please click on the following link: <a href="${link}">Reset Password</a></p>`,
  };

  try {
    await mailTransporter.sendMail(mailOptions);
    console.log("Reset password email sent successfully.");
  } catch (error) {
    console.error("Failed to send reset email: ", error);
  }
}

app.get("/reset-password", (req, res) => {
  // const { token } = req.query;
  res.sendFile(path.join(__dirname, "views", "reset-password.html"));
});

app.post("/reset-password", async (req, res) => {
  const { token, password } = req.body;
  console.log(token);
  console.log(password);
  connection.query(
    "SELECT * FROM admin_accounts WHERE resetPasswordToken = ? AND resetPasswordExpires > NOW()",
    [token],
    async (err, results) => {
      if (err || results.length === 0) {
        res.json({
          message: "Invalid or expired reset token.",
        });
      } else {
        const hashedPassword = await bcrypt.hash(password, 10);
        connection.query(
          "UPDATE admin_accounts SET password = ?, resetPasswordToken = NULL, resetPasswordExpires = NULL WHERE resetPasswordToken = ?",
          [hashedPassword, token],
          (err, updateResults) => {
            if (err || updateResults.affectedRows === 0) {
              res.json({
                message: "Error updating password.",
              });
            } else {
              res.json({
                success: true,
                message: "Your password has been updated. Please log in.",
                redirect: "/login",
              });
            }
          }
        );
      }
    }
  );
});

app.get("/reset-agent-password", (req, res) => {
  //const { token } = req.query;
  res.sendFile(path.join(__dirname, "views", "reset-agent-password.html"));
});

app.post("/reset-agent-password", async (req, res) => {
  const { token, password } = req.body;
  connection.query(
    "SELECT * FROM agent_accounts WHERE resetPasswordToken = ? AND resetPasswordExpires > NOW()",
    [token.slice(0, -1)],
    async (err, results) => {
      if (err || results.length === 0) {
        res.json({
          message: "Invalid or expired reset token.",
        });
      } else {
        const hashedPassword = await bcrypt.hash(password, 10);
        connection.query(
          "UPDATE agent_accounts SET password = ?, resetPasswordToken = NULL, resetPasswordExpires = NULL WHERE resetPasswordToken = ?",
          [hashedPassword, token.slice(0, -1)],
          (err, updateResults) => {
            if (err || updateResults.affectedRows === 0) {
              res.json({
                message: "Error updating password.",
              });
            } else {
              res.json({
                message: "Your password has been updated.",
              });
            }
          }
        );
      }
    }
  );
});

app.get("/dashboard", isAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, "views", "dashboard.html"));
});

app.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Error destroying session: ", err);
    }

    res.redirect("/login");
  });
});

app.get("/historydata", (req, res) => {
  connection.query("SELECT * FROM history", (queryErr, results) => {
    if (queryErr) {
      console.error("Error executing query: " + queryErr.message);
      res.status(500).send("Internal Server Error");
      return;
    }

    res.json(results);
  });
});

app.get("/historydetail", (req, res) => {
  const entryId = req.query.entry_id;
  connection.query(
    "SELECT * FROM history WHERE entry_id = ?",
    [entryId],
    (queryErr, results) => {
      if (queryErr) {
        console.error("Error executing query: " + queryErr.message);
        res.status(500).send("Internal Server Error");
        return;
      }

      if (results.length > 0) {
        res.json(results[0]);
      } else {
        res.status(404).json({ error: "History entry not found" });
      }
    }
  );
});

app.get("/agentsdata", (req, res) => {
  connection.query("SELECT * FROM agent_accounts", (queryErr, results) => {
    if (queryErr) {
      console.error("Error executing query: " + queryErr.message);
      res.status(500).send("Internal Server Error");
      return;
    }

    res.json(results);
  });
});

app.delete("/agentsdata/:agentId", (req, res) => {
  const agentId = req.params.agentId;

  // Perform a DELETE query to remove the agent with the specified ID
  connection.query(
    "DELETE FROM agent_accounts WHERE id = ?",
    [agentId],
    (queryErr, results) => {
      if (queryErr) {
        console.error("Error executing query: " + queryErr.message);
        res.status(500).send("Internal Server Error");
        return;
      }

      if (results.affectedRows === 0) {
        // If no rows were affected, it means there was no agent with the specified ID
        res.status(404).send("Agent not found");
      } else {
        // Agent successfully removed
        res.status(200).send("Agent removed successfully");
      }
    }
  );
});

app.put("/agentsdata/:agentId", (req, res) => {
  const agentId = req.params.agentId;
  const { firstName, lastName, email } = req.body;
  // Construct the updated data object
  const updatedData = {};
  if (firstName) updatedData.first_name = firstName;
  if (lastName) updatedData.last_name = lastName;
  if (email) updatedData.email = email;
  // Perform an UPDATE query to edit the agent with the specified ID
  connection.query(
    "UPDATE agent_accounts SET ? WHERE id = ?",
    [updatedData, agentId],
    (queryErr, results) => {
      if (queryErr) {
        console.error("Error executing UPDATE query: " + queryErr.message);
        res.json({
          message: "Internal Server Error",
        });
        return;
      }

      if (results.affectedRows === 0) {
        res.json({
          message: "Agent not found",
        });
      } else {
        res.json({
          message: "Agent updated successfully",
        });
      }
    }
  );
});

// Add route to count passed and failed calls based on profanity words
app.get("/call-stats", (req, res) => {
  // Count passed and failed calls based on profanity words
  connection.query(
    "SELECT COUNT(CASE WHEN JSON_EXTRACT(message, '$.Profanity') < 1 THEN 1 END) AS passedCalls, COUNT(CASE WHEN JSON_EXTRACT(message, '$.Profanity') >= 1 THEN 1 END) AS failedCalls FROM history",
    (err, results) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: "Internal Server Error" });
      }

      // Count total number of calls
      connection.query(
        "SELECT COUNT(*) AS totalCalls FROM history",
        (err, totalResults) => {
          if (err) {
            console.error(err);
            return res.status(500).json({ message: "Internal Server Error" });
          }

          // Calculate total duration of calls and average
          connection.query(
            "SELECT SUM(TIME_TO_SEC(duration)) AS totalDuration FROM history",
            (err, durationResults) => {
              if (err) {
                console.error(err);
                return res
                  .status(500)
                  .json({ message: "Internal Server Error" });
              }

              const totalCalls = totalResults[0].totalCalls;
              const totalDurationSeconds = durationResults[0].totalDuration;
              const averageDurationSeconds = totalDurationSeconds / totalCalls;
              const averageDuration = new Date(averageDurationSeconds * 1000)
                .toISOString()
                .substr(11, 8); // Convert seconds to HH:MM:SS format

              res.status(200).json({
                passedCalls: results[0].passedCalls,
                failedCalls: results[0].failedCalls,
                totalCalls: totalCalls,
                averageDuration: averageDuration,
              });
            }
          );
        }
      );
    }
  );
});

app.get("/user-stats/:user_id", async (req, res) => {
  const userId = req.params.user_id;

  try {
    // Count passed and failed calls based on profanity words for the specific user
    const profanityQuery =
      "SELECT COUNT(CASE WHEN JSON_EXTRACT(message, '$.Profanity') < 1 THEN 1 END) AS passedCalls, COUNT(CASE WHEN JSON_EXTRACT(message, '$.Profanity') >= 1 THEN 1 END) AS failedCalls FROM history WHERE id = ?";
    const profanityResults = await query(profanityQuery, [userId]);

    // Count total number of calls for the specific user
    const totalCallsQuery =
      "SELECT COUNT(*) AS totalCalls FROM history WHERE id = ?";
    const totalResults = await query(totalCallsQuery, [userId]);
    const totalCalls = totalResults[0].totalCalls;

    // Calculate total duration of calls for the specific user and average
    const durationQuery =
      "SELECT SUM(TIME_TO_SEC(duration)) AS totalDuration FROM history WHERE id = ?";
    const durationResults = await query(durationQuery, [userId]);
    const totalDurationSeconds = durationResults[0].totalDuration;
    const averageDurationSeconds = (totalDurationSeconds / totalCalls) | 0;
    console.log(averageDurationSeconds);
    const averageDuration = new Date(averageDurationSeconds * 1000)
      .toISOString()
      .substr(11, 8); // Convert seconds to HH:MM:SS format

    res.status(200).json({
      passedCalls: profanityResults[0].passedCalls,
      failedCalls: profanityResults[0].failedCalls,
      totalCalls: totalCalls,
      averageDuration: averageDuration,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Function to execute SQL queries
function query(sql, params) {
  return new Promise((resolve, reject) => {
    connection.query(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

app.get("/call-stats-linechart", (req, res) => {
  // Fetch passed and failed calls grouped by date
  connection.query(
    "SELECT DATE(datetime) AS callDate, " +
      "SUM(CASE WHEN JSON_EXTRACT(message, '$.Profanity') < 1 THEN 1 ELSE 0 END) AS passedCalls, " +
      "SUM(CASE WHEN JSON_EXTRACT(message, '$.Profanity') >= 1 THEN 1 ELSE 0 END) AS failedCalls " +
      "FROM history " +
      "GROUP BY DATE(datetime)",
    (err, results) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: "Internal Server Error" });
      }

      // Format data for charting
      const labels = results.map((row) => row.callDate);
      const passedCallsData = results.map((row) => row.passedCalls);
      const failedCallsData = results.map((row) => row.failedCalls);

      res.status(200).json({
        labels: labels,
        passedCallsData: passedCallsData,
        failedCallsData: failedCallsData,
      });
    }
  );
});

app.get("/agent-calls-barchart", (req, res) => {
  connection.query(
    "SELECT name AS agent, COUNT(*) AS totalCalls FROM history GROUP BY name",
    (err, results) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: "Internal Server Error" });
      }
      res.status(200).json(results);
    }
  );
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
