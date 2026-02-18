import mongoose from 'mongoose'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
const userschema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    unique: true,
  },

  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    unique: true,
  },

  password: {
    type: String,
    required: true,
  },    
  
// Get url from Cloudinary 
  avatar: {
    type: String,
    required: true,
  },

  coverimage: {
    type: String,
  },

  fullname: {
    type: String,
    required: true,
  },
  
  watchhistory: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Video' }],

  refreshToken: {
    type: String,
  },

})

//Creating save user middleware
userschema.pre('save', async function () {
  if (!this.isModified('password')) {
    return 
  }
   this.password = await bcrypt.hash(this.password, 10)
})

//Creating method to compare password
userschema.methods.ispasswordcorrect = async function (enteredpassword) {
  return await bcrypt.compare(enteredpassword, this.password)
}

//Creating method to generate jwt (Accesstoken) token
userschema.methods.generateaccesstoken=function(){
    return jwt.sign({
        _id:this._id,
        username:this.username,
        email:this.email,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
        expiresIn:process.env.ACCESS_TOKEN_DURATION,
    }
)
}
//Creating method to generate jwt (Refreshtoken) token
userschema.methods.generaterefreshtoken=function(){
    return jwt.sign({
        _id:this._id
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
        expiresIn:process.env.REFRESH_TOKEN_DURATION
    }
)
}


export const User = mongoose.model('User', userschema)
