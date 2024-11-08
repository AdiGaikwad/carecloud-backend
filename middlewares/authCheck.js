import jwt from "jsonwebtoken";
const authCheck = (req , res) => {
    try {
        const header = req.header("Authorization")
        const token = header?.split(" ")[1]
        if (!token) return res.status(403).send("Access Denied")

        //@ts-ignore
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        console.log(decoded)
        req.user = decoded
        next()
    }
    catch (err) {
        res.status(400).send("Invalid Token")
    }


}

export default authCheck