import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import multer from "multer";
import bodyParser from "body-parser";
import bcrypt from "bcrypt";
import session from "express-session";
import dotenv from "dotenv";
import connectDB from "./db.js";

import Account from "./models/Account.js";
import User from "./models/User.js";

import userRoutes from "./routes/userRoutes.js";
import upload from "./middleware/upload.js";
import dashboardRouter from "./routes/dashboard.js";
import { requireLogin } from "./middleware/auth.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

connectDB();

app.set("view engine", "ejs");
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(path.join(__dirname, "public", "uploads")));
// app.use("/uploads", express.static("public/uploads"));
app.use("/", userRoutes);
app.use("/dashboard", dashboardRouter);
// app.use("/", userRoutes);


// Ensure uploads folder exists
const uploadDir = path.join(__dirname, "public", "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// // multer setup
// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, uploadDir);
//   },
//   filename: function (req, file, cb) {
//     const ext = path.extname(file.originalname);
//     const unique = `${Date.now()}-${Math.round(Math.random()*1e9)}${ext}`;
//     cb(null, unique);
//   }
// });

// function fileFilter(req, file, cb) {
//   // accept images only
//   if (!file.mimetype.startsWith("image/")) {
//     cb(new Error("Only image files are allowed!"), false);
//     return;
//   }
//   cb(null, true);
// }

// const upload = multer({
//   storage,
//   fileFilter,
//   limits: { fileSize: 2 * 1024 * 1024 } // 2 MB
// });

app.use(
  session({
    secret: process.env.SESSION_SECRET || "secretKey123",
    resave: false,
    saveUninitialized: true,
  })
);

// function requireLogin(req, res, next) {
//   if (!req.session.user) {
//     return res.redirect("/login");
//   }
//   next();
// }

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
      role: user.role || "viewer",
      avatar: user.avatar || "",
      bio: user.bio || "",
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

// GET profile page
// app.get("/profile", requireLogin, async (req, res) => {
//   try {
//     const account = await Account.findById(req.session.user.id).lean();
//     // pass the account fetched from DB and the session user
//     res.render("profile", { account, user: req.session.user, flash: {} });
//   } catch (err) {
//     console.error(err);
//     res.sendStatus(500);
//   }
// });

// app.post(
//   "/profile/avatar",
//   requireLogin,
//   upload.single("avatar"),
//   async (req, res) => {
//     try {
//       if (!req.file) {
//         const account = await Account.findById(req.session.user.id).lean();

//         // update session avatar with current DB value (prevent undefined)
//         req.session.user.avatar = account.avatar || "";
//         await new Promise((resolve, reject) => {
//           req.session.save((err) => (err ? reject(err) : resolve()));
//         });

//         return res.render("profile", {
//           account,
//           user: req.session.user,
//           flash: { type: "danger", msg: "No file uploaded." },
//         });
//       }

//       const relativePath = `/uploads/${req.file.filename}`;

//       const updated = await Account.findByIdAndUpdate(
//         req.session.user.id,
//         { avatar: relativePath },
//         { new: true }
//       ).lean();
//       req.session.user.avatar = updated.avatar || "";

//       // also update bio in session if present (optional)
//       req.session.user.bio = updated.bio || "";

//       // persist session then redirect
//       await new Promise((resolve, reject) => {
//         req.session.save((err) => (err ? reject(err) : resolve()));
//       });

//       res.redirect("/profile");
//     } catch (err) {
//       console.error(err);
//       res.status(500).send("Upload failed.");
//     }
//   }
// );

// app.post("/profile/remove-avatar", requireLogin, async (req, res) => {
//   try {
//     const account = await Account.findById(req.session.user.id);
//     if (account && account.avatar) {
//       const filename = path.basename(account.avatar);
//       const filePath = path.join(uploadDir, filename);
//       fs.unlink(filePath, (err) => {
//         if (err) console.warn("Failed to delete previous avatar:", err);
//       });
//     }

//     account.avatar = "";
//     await account.save();

//     req.session.user.avatar = "";
//     res.redirect("/profile");
//   } catch (err) {
//     console.error(err);
//     res.sendStatus(500);
//   }
// });

// // POST update bio
// app.post("/profile/bio", requireLogin, async (req, res) => {
//   try {
//     const { bio } = req.body;
//     const safeBio = (bio || "").toString().slice(0, 500).trim();
//     const updated = await Account.findByIdAndUpdate(
//       req.session.user.id,
//       { bio: safeBio },
//       { new: true }
//     ).lean();

//     res.render("profile", {
//       account: updated,
//       user: req.session.user,
//       flash: { type: "success", msg: "Bio saved." },
//     });
//   } catch (err) {
//     console.error(err);
//     res.sendStatus(500);
//   }
// });

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
