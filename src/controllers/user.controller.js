import asynchandler from '../utils/asynchandler.uitls.js'
import apiresponse from '../utils/apiresponse.utils.js'
import { User } from '../models/user.models.js'
import apierror from '../utils/apierror.utils.js'
import uploadToCloudinary from '../utils/cloudinary.js'
import jwt from 'jsonwebtoken'
import { Subscription } from '../models/subscription.models.js'
import mongoose from 'mongoose'

const generateToken = async (id) => {
  try {
    const user = await User.findById(id)
    if (!user) {
      throw new apierror(404, 'User not found')
    }
    const accesstoken = user.generateaccesstoken()
    const refreshToken = user.generaterefreshtoken()
    user.refreshToken = refreshToken
    await user.save({ validateBeforeSave: false })
    return { accesstoken, refreshToken }
  } catch (error) {
    console.error('Error generating tokens:', error)
    throw new apierror(500, 'Failed to generate tokens')
  }
}

const registerUser = asynchandler(async (req, res) => {
  // get user details from frontend
  // validation - not empty
  // check if user already exists: username, email
  // check for images, check for avatar
  // upload them to cloudinary, avatar
  // create user object - create entry in db
  // remove password and refresh token field from response
  // check for user creation
  // return res

  const { username, email, password, fullname } = req.body

  if (!username || !email || !password || !fullname) {
    throw new apierror(400, 'All fields are required')
  }

  const existinguser = await User.findOne({ $or: [{ username }, { email }] })

  if (existinguser) {
    throw new apierror(
      400,
      'User already exists with the given username or email',
    )
  }

  const avatarpath = req.files?.avatar[0]?.path

  if (!avatarpath) {
    throw new apierror(400, 'Avatar image is required')
  }

  const coverimagepath = req.files?.coverimage[0]?.path

  if (!coverimagepath) {
    throw new apierror(400, 'Cover image is required')
  }

  const avatar = await uploadToCloudinary(avatarpath)
  const coverimage = await uploadToCloudinary(coverimagepath)

  if (!avatar) {
    throw new apierror(500, 'Failed to upload avatar image')
  }

  const user = await User.create({
    fullname,
    username,
    email,
    password,
    avatar: avatar?.url,
    coverimage: coverimage?.url || null,
  })

  const createduser = await User.findById(user._id).select(
    '-password -refreshtoken',
  )

  if (!createduser) {
    throw new apierror(500, 'Failed to create user')
  }
  console.log(createduser)
  res
    .status(200)
    .json(new apiresponse(200, 'User created sucessfully', createduser))
})

const loginUser = asynchandler(async (req, res) => {
  // req body -> data
  // username or email
  //find the user
  //password check
  //access and referesh token
  //send cookie

  const { username, email, password } = req.body
  if (!username && !email) {
    throw new apierror(400, 'Username or email is required')
  }

  const user = await User.findOne({ username, email })

  if (!user) {
    throw new apierror(404, 'User not found with the given username or email')
  }

  const ispassword = await user.ispasswordcorrect(password)

  if (!ispassword) {
    throw new apierror(400, 'Incorrect password')
  }

  const { accesstoken, refreshToken } = await generateToken(user._id)

  user.accesstoken = 0
  await user.save({ validateBeforeSave: false })

  const loginuser = await User.findById(user._id).select(
    '-password -refreshToken',
  )

  const options = {
    httpOnly: true,
    secure: true,
  }

  res
    .status(200)
    .cookie('refreshToken', refreshToken, options)
    .cookie('accesstoken', accesstoken, options)
    .json(new apiresponse(200, 'User logged in successfully', loginuser))
})

const logoutUser = asynchandler(async (req, res) => {
  if (!req.cookies?.refreshToken) {
    throw new apierror(400, 'User is not logged in')
  }

  const logout = await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: {
        refreshToken: 1,
      },
      accesstoken: 1,
    },
    {
      new: true,
    },
  )

  const options = {
    httpOnly: true,
    secure: true,
  }

  res
    .status(200)
    .clearCookie('refreshToken', options)
    .clearCookie('accesstoken', options)
    .json(new apiresponse(200, 'User logged out successfully'))

  console.log('User logged out successfully')
})

const refreshaccessToken = asynchandler(async (req, res) => {
  const incomingfreshToken =
    req.cookies?.refreshToken ||
    req.header('Authorization')?.replace('Bearer ', '')

  if (!incomingfreshToken) {
    throw new apierror(400, 'Refresh token is required')
  }

  const decodeduser = jwt.verify(
    incomingfreshToken,
    process.env.REFRESH_TOKEN_SECRET,
  )

  const user = await User.findById(decodeduser._id)

  if (!user) {
    throw new apierror(401, 'Invalid refresh token')
  }

  if (user.refreshToken !== incomingfreshToken) {
    throw new apierror(401, 'Refresh token is expired, please login again')
  }

  const { accesstoken, refreshToken } = await generateToken(decodeduser._id)

  const options = {
    httpOnly: true,
    secure: true,
  }

  res
    .status(200)
    .cookie('accesstoken', accesstoken, options)
    .cookie('refreshToken', refreshToken, options)
    .json(new apiresponse(200, 'Access token refreshed successfully'))
})

const changePassword = asynchandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body

  if (!currentPassword || !newPassword) {
    throw new apierror(400, 'Current password and new password are required')
  }

  const user = await User.findById(req.user._id)

  if (!user) {
    throw new apierror(404, 'User not found')
  }

  const ispassword = await user.ispasswordcorrect(currentPassword)

  if (!ispassword) {
    throw new apierror(400, 'Incorrect current password')
  }

  user.password = newPassword

  await user.save({ validateBeforeSave: false })

  res.status(200).json(new apiresponse(200, 'Password changed successfully'))
})

const getuser = asynchandler(async (req, res) => {
  const user = await User.findById(req.user._id).select(
    '-password -refreshToken',
  )

  if (!user) {
    throw new apierror(404, 'User not found')
  }

  res
    .status(200)
    .json(new apiresponse(200, 'User details fetched successfully', user))
})

const updatauserdetails = asynchandler(async (req, res) => {
  const { fullname, email } = req.body

  if (!fullname || !email) {
    throw new apierror(400, 'Fullname and email are required')
  }

  const updateduser = await User.findByIdAndUpdate(
    req.user._id,
    {
      fullname,
      email,
    },
    { new: true },
  ).select('-password -refreshToken')

  if (!updateduser) {
    throw new apierror(404, 'User not found')
  }

  res
    .status(200)
    .json(
      new apiresponse(200, 'User details updated successfully', updateduser),
    )
})

const updateavatar = asynchandler(async (req, res) => {
  const updatedpath = req.file?.path

  if (!updatedpath) {
    throw new apierror(400, 'Avatar image is required')
  }

  const updatedavatar = await uploadToCloudinary(updatedpath)

  if (!updatedavatar) {
    throw new apierror(500, 'Failed to upload avatar image')
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      avatar: updatedavatar.url,
    },
    { new: true },
  ).select('-password -refreshToken')

  if (!user) {
    throw new apierror(404, 'User not found')
  }
  res
    .status(200)
    .json(new apiresponse(200, 'User avatar updated successfully', user))
})

const updatecoverimage = asynchandler(async (req, res) => {
  const updatedpath = req.file?.path

  if (!updatedpath) {
    throw new apierror(400, 'Cover image is required')
  }

  const updatedcoverimage = await uploadToCloudinary(updatedpath)

  if (!updatedcoverimage) {
    throw new apierror(500, 'Failed to upload cover image')
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      coverimage: updatedcoverimage.url,
    },
    {
      new: true,
    },
  ).select('-password -refreshToken')

  if (!user) {
    throw new apierror(404, 'User not found')
  }

  res
    .status(200)
    .json(new apiresponse(200, 'User cover image updated successfully', user))
})

const getuserchannelprofile = asynchandler(async (req, res) => {
  const username = req.params.username

  if (!username?.trim()) {
    throw new apierror(400, 'Username is required')
  }

  const channelprofile = await User.aggregate([
    {
      $match: {
        username: username.toLowerCase(),
      },
    },
    {
      $lookup: {
        from: 'subscriptions',
        localField: '_id',
        foreignField: 'channel',
        as: 'subscribers',
      },
    },
    {
      $lookup: {
        from: 'subscriptions',
        localField: '_id',
        foreignField: 'subscriber',
        as: 'subscribedto',
      },
    },
    {
      $addFields: {
        subscribercount: { $size: '$subscribers' },
        subscribedtocount: { $size: '$subscribedto' },
        issubscribed: {
          $cond: {
            if: { $in: [req.user?._id, '$subscribers.subscriber'] },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        fullName: 1,
        username: 1,
        subscribercount: 1,
        subscribedtocount: 1,
        issubscribed: 1,
        avatar: 1,
        coverImage: 1,
        email: 1,
      },
    },
  ])

  if (!channelprofile?.length) {
    throw new apierror(404, 'User not found with the given username')
  }
  console.log(channelprofile)
  res
    .status(200)
    .json(
      new apiresponse(
        200,
        'User channel profile fetched successfully',
        channelprofile[0],
      ),
    )
})

const getwatchhistory = asynchandler(async (req, res) => {
  const user = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.user._id),
      },
    },
    {
      $lookup: {
        from: 'videos',
        localField: 'watchhistory',
        foreignField: '_id',
        as: 'watchhistory',
        pipeline: [
          {
            $lookup: {
              from: 'users',
              localField: 'owner',
              foreignField: '_id',
              as: 'owner',
              pipeline: [
                {
                 $project: {
                fullName: 1,
                username: 1,
                avatar: 1,
              },
            }
              ]
            },
          },
        ],
      },
    },
  ])

  if (!user?.length) {
    throw new apierror(404, 'User not found')
  }
  res
    .status(200)
    .json(
      new apiresponse(
        200,
        'User watch history fetched successfully',
        user[0].watchhistory,
      ),
    )
})

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshaccessToken,
  changePassword,
  getuser,
  updatauserdetails,
  updateavatar,
  updatecoverimage,
  getuserchannelprofile,
  getwatchhistory
}
