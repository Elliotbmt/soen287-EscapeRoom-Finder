// This file starts Express, reads the .env file, and handles all routes.
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const express = require("express");
const session = require("express-session");

const app = express();
const publicFolder = path.join(__dirname, "public");
const usersFile = path.join(__dirname, "data", "users.json");
const roomsFile = path.join(__dirname, "data", "rooms.json");

// Read KEY=value lines from .env without installing another package.
function loadEnvironmentFile() {
  const environmentPath = path.join(__dirname, ".env");

  if (!fs.existsSync(environmentPath)) {
    return;
  }

  const lines = fs.readFileSync(environmentPath, "utf8").split(/\r?\n/);

  for (let i = 0; i < lines.length; i++) {
    const setting = lines[i].trim();

    if (setting === "" || setting.charAt(0) === "#") {
      continue;
    }

    const separator = setting.indexOf("=");
    if (separator === -1) {
      continue;
    }

    const name = setting.slice(0, separator).trim();
    const value = setting.slice(separator + 1).trim();

    if (name && !process.env[name]) {
      process.env[name] = value;
    }
  }
}

loadEnvironmentFile();

if (!process.env.SESSION_SECRET) {
  console.error("Missing SESSION_SECRET. Copy .env.example to .env and set a secret.");
  process.exit(1);
}

const PORT = process.env.PORT || 3000;
const usernamePattern = /^[A-Za-z0-9_]{3,20}$/;

app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(
  session({
    name: "escapeRoomSession",
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
      maxAge: 1000 * 60 * 60 * 2
    }
  })
);

// Only send dashboard files to a signed-in user.
function requireLogin(request, response, next) {
  if (!request.session.user) {
    response.redirect("/login");
    return;
  }

  next();
}

function showDashboard(request, response) {
  response.sendFile(path.join(publicFolder, "dashboard.html"));
}

function showHomePage(request, response) {
  response.sendFile(path.join(publicFolder, "index.html"));
}

function showLoginPage(request, response) {
  response.sendFile(path.join(publicFolder, "login.html"));
}

function showRegisterPage(request, response) {
  response.sendFile(path.join(publicFolder, "register.html"));
}

async function showRooms(request, response) {
  try {
    const fileContents = await fs.promises.readFile(roomsFile, "utf8");
    response.json(JSON.parse(fileContents));
  } catch (error) {
    console.error("Could not read room data:", error.message);
    response.status(500).json({ message: "Room listings are unavailable right now." });
  }
}

function isValidPassword(password) {
  return typeof password === "string" && password.length >= 8 && password.length <= 128;
}

async function registerUser(request, response) {
  const body = request.body || {};
  const username = typeof body.username === "string" ? body.username.trim() : "";
  const password = body.password;
  const confirmation = body.confirmPassword;

  if (!username || !password || !confirmation) {
    response.status(400).json({ message: "Please fill in every field." });
    return;
  }

  if (!usernamePattern.test(username)) {
    response.status(400).json({
      message: "Your username must be 3–20 characters using letters, numbers, or underscores."
    });
    return;
  }

  if (!isValidPassword(password)) {
    response.status(400).json({ message: "Your password must be between 8 and 128 characters." });
    return;
  }

  if (password !== confirmation) {
    response.status(400).json({ message: "Those passwords do not match." });
    return;
  }

  try {
    const fileContents = await fs.promises.readFile(usersFile, "utf8");
    const users = JSON.parse(fileContents);
    const usernameKey = username.toLowerCase();
    let usernameAlreadyExists = false;

    for (let i = 0; i < users.length; i++) {
      if (users[i].usernameKey === usernameKey) {
        usernameAlreadyExists = true;
      }
    }

    if (usernameAlreadyExists) {
      response.status(409).json({ message: "That username is already taken. Try another one." });
      return;
    }

    const salt = crypto.randomBytes(16).toString("hex");
    const passwordHash = crypto.scryptSync(password, salt, 64);

    users.push({
      username: username,
      usernameKey: usernameKey,
      salt: salt,
      passwordHash: passwordHash.toString("hex")
    });

    await fs.promises.writeFile(usersFile, JSON.stringify(users, null, 2) + "\n", "utf8");
    response.status(201).json({ message: "Your account is ready. You can log in now." });
  } catch (error) {
    console.error("Registration failed:", error.message);
    response.status(500).json({ message: "We could not complete that request. Please try again." });
  }
}

async function logInUser(request, response) {
  const body = request.body || {};
  const username = typeof body.username === "string" ? body.username.trim() : "";
  const password = body.password;

  if (!username || !password) {
    response.status(400).json({ message: "Enter your username and password." });
    return;
  }

  if (!usernamePattern.test(username) || !isValidPassword(password)) {
    response.status(400).json({ message: "Check your username and password, then try again." });
    return;
  }

  try {
    const fileContents = await fs.promises.readFile(usersFile, "utf8");
    const users = JSON.parse(fileContents);
    const usernameKey = username.toLowerCase();
    let foundUser = null;

    for (let i = 0; i < users.length; i++) {
      if (users[i].usernameKey === usernameKey) {
        foundUser = users[i];
      }
    }

    if (!foundUser) {
      response.status(401).json({ message: "That username and password do not match." });
      return;
    }

    const submittedHash = crypto.scryptSync(password, foundUser.salt, 64);
    const savedHash = Buffer.from(foundUser.passwordHash, "hex");

    if (savedHash.length !== submittedHash.length || !crypto.timingSafeEqual(savedHash, submittedHash)) {
      response.status(401).json({ message: "That username and password do not match." });
      return;
    }

    request.session.regenerate(function(error) {
      if (error) {
        console.error("Could not start login session:", error.message);
        response.status(500).json({ message: "We could not complete that request. Please try again." });
        return;
      }

      request.session.user = { username: foundUser.username };
      response.json({ message: "You are signed in." });
    });
  } catch (error) {
    console.error("Login failed:", error.message);
    response.status(500).json({ message: "We could not complete that request. Please try again." });
  }
}

function showCurrentUser(request, response) {
  if (!request.session.user) {
    response.status(401).json({ message: "You are not signed in." });
    return;
  }

  response.json({ username: request.session.user.username });
}

function logOutUser(request, response) {
  request.session.destroy(function(error) {
    if (error) {
      console.error("Could not end login session:", error.message);
      response.status(500).json({ message: "We could not complete that request. Please try again." });
      return;
    }

    response.clearCookie("escapeRoomSession", {
      httpOnly: true,
      sameSite: "lax",
      secure: false
    });
    response.json({ message: "You are signed out." });
  });
}

app.get("/dashboard", requireLogin, showDashboard);
app.get("/dashboard.html", requireLogin, showDashboard);
app.get("/", showHomePage);
app.get("/login", showLoginPage);
app.get("/register", showRegisterPage);
app.get("/api/rooms", showRooms);
app.post("/api/auth/register", registerUser);
app.post("/api/auth/login", logInUser);
app.get("/api/auth/me", showCurrentUser);
app.post("/api/auth/logout", logOutUser);

app.use(express.static(publicFolder));

app.use(function(error, request, response, next) {
  if (error.status === 400) {
    response.status(400).json({ message: "Please send valid form details." });
    return;
  }

  console.error("Request failed:", error.message);
  response.status(500).json({ message: "Something went wrong. Please try again." });
});

app.listen(PORT, function() {
  console.log("Escape Room Finder is running at http://localhost:" + PORT);
});
