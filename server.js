import express from "express"

const app = express();


import auth from "./routes/auth.js"

app.use("/auth/v1/", auth)

app.get("/", (req, res)=>{
    res.send("Ping");
})



const PORT = 5000
app.listen(PORT, ()=>{
    console.log(`Server is running on port ${PORT}`)
})


export * from '@prisma/client'