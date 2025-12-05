import express from "express";
import bodyParser from "body-parser";
import bcrypt from "bcrypt";
import session from "express-session";
import dotenv from "dotenv";
import connectDB from "./db.js";
import Account from "./models/Account.js";
import User from "./models/User.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

connectDB();

app.set("view engine", "ejs");
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(
  session({
    secret: process.env.SESSION_SECRET || "secretKey123",
    resave: false,
    saveUninitialized: true,
  })
);

function requireLogin(req, res, next) {
  if (!req.session.user) {
    return res.redirect("/login");
  }
  next();
}

app.get("/login", (req, res) => {
  res.render("login", { error: null });
});

app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await Account.findOne({ email });
    if (!user)
      return res.render("login", { error: "No user found with that email." });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.render("login", { error: "Invalid password." });

    req.session.user = {
      id: user._id,
      username: user.username,
      email: user.email,
    };
    res.redirect("/");
  } catch (err) {
    console.error(err);
    res.render("login", { error: "An error occurred. Try again." });
  }
});

app.get("/register", (req, res) => {
  res.render("register", { error: null });
});

app.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const existing = await Account.findOne({ email });
    if (existing)
      return res.render("register", { error: "Email already exists!" });

    const hashed = await bcrypt.hash(password, 10);
    const newAcc = new Account({ username, email, password: hashed });
    await newAcc.save();

    res.redirect("/login");
  } catch (err) {
    console.error(err);
    res.render("register", { error: "Registration failed." });
  }
});

// Logout
app.get("/logout", (req, res) => {
  req.session.destroy(() => res.redirect("/login"));
});

app.get("/", requireLogin, async (req, res) => {
  try {
    const users = await User.find().lean();
    res.render("home", { data: users, user: req.session.user });
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});

app.post("/", requireLogin, async (req, res) => {
  try {
    const { userUniqueId, userName, userEmail, userAge } = req.body;

    if (!userUniqueId || !userName || !userEmail || !userAge) {
      const users = await User.find().lean();
      return res.render("home", {
        data: users,
        user: req.session.user,
        error: "All fields are required",
      });
    }

    const exists = await User.findOne({ userUniqueId });
    if (exists) {
      const users = await User.find().lean();
      return res.render("home", {
        data: users,
        user: req.session.user,
        error: "User ID already exists",
      });
    }
    const newUser = new User({
      userUniqueId,
      userName,
      userEmail,
      userAge: Number(userAge),
    });
    await newUser.save();
    const users = await User.find().lean();
    res.render("home", { data: users, user: req.session.user });
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});

app.post("/delete", requireLogin, async (req, res) => {
  try {
    const { userUniqueId } = req.body;
    await User.findOneAndDelete({ userUniqueId });
    const users = await User.find().lean();
    res.render("home", { data: users, user: req.session.user });
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});

app.post("/update", requireLogin, async (req, res) => {
  try {
    const { userUniqueId, userName, userEmail, userAge } = req.body;

    if (!userUniqueId) {
      const users = await User.find().lean();
      return res.render("home", {
        data: users,
        user: req.session.user,
        error: "User ID is required",
      });
    }

    await User.findOneAndUpdate(
      { userUniqueId },
      {
        ...(userName && { userName }),
        ...(userEmail && { userEmail }),
        ...(userAge && { userAge: Number(userAge) }),
      },
      { new: true }
    );
    const users = await User.find().lean();
    res.render("home", { data: users, user: req.session.user });
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
