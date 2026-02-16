import asynchandler from '../utils/asynchandler.uitls.js';
import apiresponse from '../utils/apiresponse.utils.js';
import {User} from '../models/user.models.js';
import apierror from '../utils/apierror.utils.js';
import uploadToCloudinary from '../utils/cloudinary.js';

const generateToken = async(id)=>{
    try {
        const user = await User.findById(id);
        if(!user){
            throw new apierror(404,'User not found');
        }
        const accesstoken = user.generateaccesstoken();
        const refreshTokens = user.generaterefreshtoken();
        user.refreshTokens = refreshTokens;
        await user.save({validateBeforeSave:false});
        return {accesstoken,refreshTokens};
    } catch (error) {
        console.error('Error generating tokens:', error);
        throw new apierror(500,'Failed to generate tokens');
    }
}

const registerUser = asynchandler(async(req, res) =>{
    // get user details from frontend
    // validation - not empty
    // check if user already exists: username, email
    // check for images, check for avatar
    // upload them to cloudinary, avatar
    // create user object - create entry in db
    // remove password and refresh token field from response
    // check for user creation
    // return res

    const {username,email,password,fullname} = req.body;

    if(!username || !email || !password || !fullname){
        throw new apierror(400, 'All fields are required');
    }

    const existinguser= await User.findOne({$or:[{username},{email}]});

    if(existinguser){
        throw new apierror(400,'User already exists with the given username or email');
    }

    const avatarpath = req.files?.avatar[0]?.path
    
    if(!avatarpath){
        throw new apierror(400,'Avatar image is required');
    }

    const coverimagepath = req.files?.coverimage[0]?.path;

    if(!coverimagepath){
        throw new apierror(400,'Cover image is required');
    }

    const avatar = await uploadToCloudinary(avatarpath);
    const coverimage = await uploadToCloudinary(coverimagepath);

    if(!avatar){
        throw new apierror(500,'Failed to upload avatar image');
    }

    const user = await User.create({
        fullname,
        username,
        email,
        password,
        avatar: avatar?.url,
        coverimage: coverimage?.url || null,
    })

    const createduser = await User.findById(user._id).select('-password -refreshtoken');

    if(!createduser){
        throw new apierror(500,'Failed to create user');
    }
    console.log(createduser);
    res.
    status(200).
    json(new apiresponse(200,"User created sucessfully",createduser));
})

const loginUser = asynchandler(async(req,res)=>{
    // req body -> data
    // username or email
    //find the user
    //password check
    //access and referesh token
    //send cookie

    const {username,email,password}=req.body;
    if(!username && !email){
        throw new apierror(400,"Username or email is required");
    }
     
    const user = await User.findOne({username,email});

    if(!user){
        throw new apierror(404,"User not found with the given username or email");
    }

    const ispassword = await user.ispasswordcorrect(password);

    if(!ispassword){
        throw new apierror(400,"Incorrect password");
    }

    const {accesstoken,refreshTokens} = await generateToken(user._id);

    const loginuser = await User.findById(user._id).select('-password -refreshTokens');

    const options = {
        httpOnly:true,
        secure:true
    }

    res.
    status(200).
    cookie('refreshTokens',refreshTokens,options).
    cookie('accesstoken',accesstoken,options).
    json(new apiresponse(200,"User logged in successfully",loginuser));
})




export {registerUser,loginUser};