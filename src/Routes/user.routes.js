import { Router } from "express";
import {registerUser,loginUser,logoutUser,refreshaccessToken, changePassword,getuser,updatauserdetails} from "../controllers/user.controller.js";
import {upload} from "../middlewares/multer.middlewares.js";
import { verifytoken } from "../middlewares/authentication.middlewares.js";
const router = Router();

router.post('/register',upload.fields([{name:'avatar',maxCount:1},{name:'coverimage',maxCount:1}]),registerUser);
router.post('/login',loginUser);
router.post("/logout",verifytoken,logoutUser)
router.post("/refresh-token",refreshaccessToken)
router.patch("/change-password",verifytoken,changePassword)
router.get("/getuser",verifytoken,getuser)
router.patch("/update-profile",verifytoken,updatauserdetails)

export default router;