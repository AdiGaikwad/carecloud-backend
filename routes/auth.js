import { Router } from "express";
const router = Router();
import { PrismaClient } from "@prisma/client";
const client = new PrismaClient();
import bcrypt from "bcrypt";
import {createHash} from "crypto"
const SALT_ROUNDS = 10;
router.get("/status", (req, res)=>{
    res.json({
        message: "Server is up",
        serverTime: Date.now()
    })
})



router.post("/onboarding/register", async (req, res) => {
    console.log(req.body)
    const {  password, firstName, lastName, email } = req.body;
    if (username && password && firstName && lastName && email) {
  
      const saltRounds = 10;
      let hash256 = createHash("sha256").update(password).digest("hex")
      let salt = bcrypt.genSaltSync(saltRounds)
      let hashed = bcrypt.hashSync(hash256, salt)
      try {
        const user = await prisma.user.create({
          data: {
            email,
            firstName,
            lastName,
            password: hashed,
            id: nanoid(14),
          }
        });
        res.status(201).json({ Success: true, msg: "Registered Successfully", username: user.username });
      } catch (err) {
        console.log(err)
        res.status(200).json({ Error: true, msg: 'Username or email already exists' });
      }
    }
  
    else {
      res.json({
        Error: true,
        msg: "Please check your inputs "
      })
    }
  })


export default router;