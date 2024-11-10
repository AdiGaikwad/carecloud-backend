import jwt from "jsonwebtoken";
const authCheck = (req , res, next) => {
    try {
        const header = req.header("Authorization") || "Authorization " + req.cookies.token
        console.log(header)
        const token = header?.split(" ")[1]
        if (!token) return res.status(403).send("Access Denied")
            console.log(process.env.JWT_SECRET)
        //@ts-ignore
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        console.log(decoded)
        req.user = decoded
        next()
    }
    catch (err) {
        console.log(err)
        res.status(400).send("Invalid Token")
    }


}

export default authCheck