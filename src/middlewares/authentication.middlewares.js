import apierror from "../utils/apierror.utils.js";
import jwt from "jsonwebtoken";
import asynchandler from '../utils/asynchandler.uitls.js'
import { User } from '../models/user.models.js'

export const verifytoken = asynchandler(async(req,__,next)=>{

    const token = req.cookies?.accesstoken || req.header("Authorization")?.replace("Bearer ", "")

    if(!token){
        throw new apierror(401,"Unauthorized, token not found")
    }

    
    const decodedtoken = jwt.verify(token,process.env.ACCESS_TOKEN_SECRET)

    if(!decodedtoken){
        throw new apierror(401,"Unauthorized, invalid token")
    }

    const user = await User.findById(decodedtoken._id).select("-password -refreshTokens")

    if(user.accesstoken!==0){
        throw new apierror(401,"Unauthorized, token expired")
    }
    
    if(!user){
        throw new apierror(404,"User not found")
    }

    req.user = user;
    next()
})