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
import authCheck from "../middlewares/authCheck.js";
import { z } from "zod";
router.get("/status", (req, res) => {
  res.json({
    message: "Server is up",
    serverTime: Date.now(),
  });
});

router.post("/register", async (req, res) => {
  const requiredbody = z.object({
    email: z.string().min(3).max(50).email(),
    password: z.string().min(8).max(15),
    firstName: z.string().min(1).max(50),
    lastName: z.string().min(1).max(50),
  });
  const parseDatawithSuccess = requiredbody.safeParse(req.body);
  if (!parseDatawithSuccess.success) {
    res.json({
      message: "Invalid Password",
      Error: parseDatawithSuccess.error,
    });
    return;
  }
  const { email, password, firstName, lastName } = req.body;

  const hashedpassword = await bcrypt.hash(password, SALT_ROUNDS);

  try {
    const admin = await prisma.doctor.create({
      data: {
        email,
        firstName,
        lastName,
        password: hashedpassword,
        id: `CCD-U${nanoid(6)}`,
        role: "doctor",
      },
    });
    res.status(201).json({
      Success: true,
      msg: "Registered Successfully",
      doctorId: admin.id,
    });
  } catch (err) {
    console.log(err);
    res.status(200).json({ Error: true, msg: "Email already exists" });
  }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  // console.log(email);
  // console.log(password);

  if (email && password) {
    try {
      const user = await prisma.doctor.findFirst({
        where: {
          OR: [{ email: email }, { id: email }],
        },
      });
      // console.log(user);
      if (!user) {
        return res.json({
          Error: true,
          msg: "Incorrect DoctorID or email.",
        });
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        res.json({ Error: true, msg: "Incorrect Password" });
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

function convertToTimestamp(datetimeString) {
  // Parse the datetime string and create a Date object
  const date = new Date(datetimeString);

  // Return the timestamp in milliseconds
  return date.getTime();
}

router.get("/check/access", authCheck, async (req, res) => {
  let current = Date.now();

  let access = await prisma.access.findMany({
    where: { doctorId: req.user.user.id },
    orderBy:{
      createdAt: "desc"
    }
  });

  if (access && access.length > 0) {
    const timestamp = convertToTimestamp(access[0].expires);
    console.log(timestamp)
    console.log(access[0].expires)

    if( Number(timestamp) > current){

      res.json({ Success: true, access: access[0] });
    }
    else{
    res.json({ Error: true, msg: "Access Expired. Request Again " });

    }
  } else {
    res.json({ Error: true, msg: "No Access is found " });
  }
});

router.get("/get/access/data", authCheck, async (req, res) => {
  let current = Date.now();

  let access = await prisma.access.findMany({
    where: { doctorId: req.user.user.id },
    orderBy:{
      createdAt: "desc"
    }
  });
  if (access && access.length > 0) {

    const timestamp = convertToTimestamp(access[0].expires);
    if( timestamp > current){

    const user = await prisma.user.findUnique({
      where: { id: access[0].userId },
    });
    if (user) {
      const { password, ...newUser } = user;

      res.json({ Success: true, user: newUser });
    } else {
      res.json({ Error: true, msg: "No Access is found Please retry " });
    }
  }
  else{

    res.json({ Error: true, msg: "Access Expired. Please request again  " });
  }

  } else {
    res.json({ Error: true, msg: "No Access is found " });
  }
});

router.get("/doctor/data", authCheck, async (req, res) => {
  res.json(req.user);
});

export default router;
