import { Router } from "express";
const router = Router();
import bcrypt from "bcrypt";
import { createHash } from "crypto";
const SALT_ROUNDS = 10;
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
import { customAlphabet } from "nanoid";
const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const nanoid = customAlphabet(alphabet, 8);
import jwt from "jsonwebtoken";
import authCheck from "../middlewares/authCheck.js"
router.get("/status", (req, res) => {
  res.json({
    message: "Server is up",
    serverTime: Date.now(),
  });
});

router.post("/register", async (req, res) => {
  // console.log(req.body);
  const { password, firstName, lastName, email } = req.body;
  if (password && firstName && lastName && email) {
    let hash256 = createHash("sha256").update(password).digest("hex");
    let salt = bcrypt.genSaltSync(SALT_ROUNDS);
    let hashed = bcrypt.hashSync(hash256, salt);
    try {
      const user = await prisma.user.create({
        data: {
          email,
          firstName,
          lastName,
          password: hashed,
          id: `CCH-U${nanoid(8)}`,
        },
      });
      res.status(201).json({
        Success: true,
        msg: "Registered Successfully",
        healthId: user.id,
      });
    } catch (err) {
      console.log(err);
      res.status(200).json({ Error: true, msg: "Email already exists" });
    }
  } else {
    res.json({
      Error: true,
      msg: "Please check your inputs ",
    });
  }
});

router.post("/login", async (req, res) => {
  const { password, email } = req.body;
  // console.log(req.body)
  if (email && password) {
    try {
      const user = await prisma.user.findFirst({
        where: {
          OR: [{ email: email }, { id: email }],
        },
      });

      if (!user) {
        return res.json({
          Error: true,
          message: "Incorrect HealthID or email.",
        });
      }

      // Compare the plain password with the hashed password stored in the database
      let hashed = createHash("sha256").update(password).digest("hex");
      const isPasswordValid = await bcrypt.compare(hashed, user.password);

      if (!isPasswordValid) {
        res.json({ Error: true, msg: "Incorrect password." });
      } else {
        try {
          const { password, ...newUser } = user;
          //@ts-ignore
          const token = jwt.sign({ user: newUser }, process.env.JWT_SECRET, {
            expiresIn: "2d",
          });
          res.json({ token, msg: "Login Successfull" });
        } catch (err) {
          console.log(err);
          res.json({ Error: true, msg: "Unable to login." });
        }
      }
    } catch (err) {
      console.log(err);
      res.status(200).json({ Error: true, msg: "Unable to login " });
    }
  } else {
    res.json({
      Error: true,
      msg: "Please check your inputs ",
    });
  }
});


router.get("/get/user/data", authCheck,  async (req, res)=>{
 res.json(req.user)
})

export default router;
