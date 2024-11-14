import { Router } from "express";
const router = Router();
import bcrypt from "bcrypt";
import { createHash } from "crypto";
const SALT_ROUNDS = 10;
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
import { customAlphabet } from "nanoid";
const alphabet = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const nanoid = customAlphabet(alphabet, 14);
import jwt from "jsonwebtoken";
import authCheck from "../middlewares/authCheck.js"
import {z} from "zod"
router.get("/status", (req, res) => {
  res.json({
    message: "Server is up",
    serverTime: Date.now(),
  });
});

router.post("/register" , async (req,res)=>{

    const requiredbody = z.object({
        email :z.string().min(3).max(50).email(),
        password : z.string().min(8).max(15),
        firstName: z.string().min(1).max(50),
        lastName: z.string().min(1).max(50),
    })
    const parseDatawithSuccess = requiredbody.safeParse(req.body)
    if(!parseDatawithSuccess.success)
    {
        res.json({
            message: "Incorrect Password",
            Erroe: parseDatawithSuccess.error
            
        })
        return

    }
    const {email,password,firstName,lastName} = req.body

    const hashedpassword = await bcrypt.hash(password,SALT_ROUNDS);

    try{

        const admin = await prisma.user.create({
            data: {
                email,
                firstName,
                lastName,
                password: hashedpassword,
                id: `CCH-U${nanoid(14)}`,
                role: "admin"
              },
            
            });
          res.status(201).json({
            Success: true,
            msg: "Registered Successfully",
            healthId: admin.id,

          })
    }
    catch (err){
        console.log(err)
        res.status(200).json({ Error: true, msg: "Email already exists" });

    }


    

});

router.post("/login" ,async(req,res)=>
{
    const {email , password} = req.body
    console.log(email); 
    console.log(password)

    if(email&&password)
    {
        try {
            const user = await prisma.user.findFirst({
                where: {
                    OR: [{ email: email }, { id: email }],
                  },
            })
            console.log(user);
            if(!user)
            {
                return res.json({
                    Error: true,
                    message: "Incorrect HealthID or email.",
                  });

               
            }
          
            const isPasswordValid = await bcrypt.compare(password , user.password)
            if(!isPasswordValid)
            {
                res.json({
                    message: "Incorrect Password"
                })
            }
            else{
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


        }
        catch (err)
        {
            console.log(err);
            res.status(200).json({ Error: true, msg: "Unable to login " });
        }
    }
    else{
        res.json({
            Error: true,
            msg: "Please check your inputs ",
          });
    }

})

export default router ;