import { Router } from "express";
const router = Router();
import bcrypt from "bcrypt";
import { createHash } from "crypto";
const SALT_ROUNDS = 10;
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
import { customAlphabet } from "nanoid";
const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const nanoid = customAlphabet(alphabet, 12);
import jwt from "jsonwebtoken";
import authCheck from "../middlewares/authCheck.js";
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
          role: "user",
          id: `CCH-U${nanoid(3)}${nanoid(8)}`,
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
          msg: "Incorrect HealthID or email.",
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

router.post("/ask/doctor/access", authCheck, async (req, res) => {
  const otpseed = "1234567890";
  let { patientId, doctorId } = req.body;

  let patient = await prisma.user.findFirst({
    where: {
      OR: [{ email: patientId }, { id: patientId }],
    },
  });
  let checkAccess = await prisma.access.findFirst({
    where: {userId: patient.id}
  })
  console.log(checkAccess)
  if (patient) {
    if(!checkAccess){

    const otp = customAlphabet(otpseed, 6);
    let updated = await prisma.user.update({
      where: { id: patient.id },
      data: {
        otp: {
          otp: otp(),
          expires: Date.now() + 180000,
          doctorId: doctorId,
        },
        otpExpires: (Date.now() + 180000).toString(),
      },
    });
    res.json({
      Success: true,
      msg: "Successfully sent request. Please enter OTP",
      updated,
    });
  }
  else{
    res.json({ Error: true, msg: "Access Already provided. Please revoke or wait for some time ", patient });

  }
  } else {
    res.json({ Error: true, msg: "Incorrect Health Id or Email ", patient });
  }
});

router.post("/grant/doctor/access", authCheck, async (req, res) => {
  let { patientId, otp, duration } = req.body;
  if (patientId && otp && duration) {
    let patient = await prisma.user.findFirst({
      where: {
        OR: [{ email: patientId }, { id: patientId }],
      },
    });
    let doctor = await prisma.doctor.findFirst({
      where: {
        id: req.user.user.id,
      },
    });

    console.log(patient);

    if (patient && doctor) {
      let current = Date.now();
      // console.log(current)
      const expires = new Date();
      expires.setMinutes(expires.getMinutes() + duration);
      if (patient.otp.otp == otp && Number(patient.otp.expires) > current) {
        const access = await prisma.access.create({
          data: {
            accessid: "CCA-" + nanoid(18),
            doctorId: doctor.id,
            userId: patient.id,
            expires,
          },
        });

        let clear =  {
          otp: patient.otp.otp,
          expires: Date.now(),
          doctorId: doctor.id,
        }
        console.log(clear)
        let clearOtp = await prisma.user.update({
          where: {id: patient.id},
          data:{
            otp: {
              otp: patient.otp.otp,
              expires: Date.now(),
              doctorId: doctor.id,
            },
            otpExpires: (Date.now()).toString(),
          }
        })
        if(clearOtp){

          res.json({
            Success: true,
            msg:
            "Successfully Verified OTP ! Access granted for " +
            duration +
            " Minutes",
            access,
          });
        }
        else{
          res.json({
            Success: true,
            msg:
            "Successfully Verified OTP ! Access 2 granted for " +
            duration +
            " Minutes",
            access,
          });
        }
       
      } else {
        res.json({
          Error: true,
          msg: "Invalid or Expired Otp ",
        });
      }
    } else {
      res.json({
        Error: true,
        msg: "Unable to process request. Try again later",
      });
    }
  } else {
    res.json({ Error: true, msg: "Invalid Inputs" });
  }
});

router.get("/get/user/data", authCheck, async (req, res) => {
  res.json(req.user);
});

router.get("/check/request", authCheck, async (req, res) => {
  let current = Date.now();

  const check = await prisma.user.findUnique({
    where: {
      id: req.user.user.id,
    },
  });

  if (Number(check && check.otp && check.otp.expires && check.otp.expires ) > current) {
    const { password, ...newUser } = check;

    res.json({ Success: true, check: newUser });
  }
  else{
    res.json({Error: true, msg: " No Recent Requests"})
  }
});

export default router;
