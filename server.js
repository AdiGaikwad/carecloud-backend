import express from "express"
import bodyParser from "body-parser";
import cors from "cors"
const app = express();

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

let whitelist = [
    'http://developer.adi:5000',
    "developer.adi:5000", 
    'http://developer.adi:3000',
    "developer.adi:3000",
    ];
var corsOptions = {
    origin: function (origin, callback) {
      if (whitelist.indexOf(origin) !== -1 || !origin) {
        callback(null, true)
      } else {
        callback(new Error('Not allowed by CORS'))
      }
    },
      methods: ['POST',  'GET', 'OPTIONS', 'HEAD'],
      // allowedHeaders: ['cookie'],
    credentials: true
  }


app.use(cors(corsOptions))


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