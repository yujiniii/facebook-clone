const express = require("express");
const Post = require("../models/Post");
const User = require("../models/User");
const Comment = require("../models/Comment");
const multer = require("cloudinary");
const router = express.Router();

//Multer Setup
const storage = multer.diskStorage({
    filename:(req,file,callback)=>{
        callback(null,Date.now()+file.originname);
    }
});

const imageFilter = (req,file,callback)=>{
    if(!file.originname.match(/\.(jpg|jpeg|png)$/i)){
        return callback(new Error("only image files are allowed"), false);
    }
    callback(null,true);
};

const upload = multer({storage:storage,fileFilter:imageFilter});

//cloudinary setup
cloudinary.config({
    cloud_name:process.env.CLOUDNARY_CLOUD_NAME,
    api_key:process.env.CLOUDNARY_CLOUD_API_KEY,
    api_secret:process.env.CLOUDNARY_CLOUD_API_SECRET
});

//middle ware
const isLoggedIn = (req,res,next)