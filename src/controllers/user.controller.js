import asynchandler from '../utils/asynchandler.uitls.js';
import apiresponse from '../utils/apiresponse.utils.js';
import {User} from '../models/user.models.js';
import apierror from '../utils/apierror.utils.js';
import uploadToCloudinary from '../utils/cloudinary.js';

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
    json(new apiresponse(200,createduser,"User created sucessfully"))
})




export default registerUser;