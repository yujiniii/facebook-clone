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
    api_key:process.env.CLOUDNARY_API_KEY,
    api_secret:process.env.CLOUDNARY_API_SECRET
});

//middle ware
const isLoggedIn = (req,res,next)=>{
    if(req.isAuthenticated()){
        return next();
    }
    req.flash("error","You need to e logged in to do that");
    res.redirect("/user/login");
};

//Router
router("/",isLoggedIn,(req,res)=>{
    User.findById(req.user._id)    // 친구들의 게시글
        .populate({
            path:"friends",
            populate:{
                path:"posts",
                model:"Post"
            }
        })
        .populate("posts") //현재 사용자의 게시글
        .exec((err,user)=>{
            if(err){
                console.log(err);
                req.flash("error","there has been an error finding all posts");
                res.render("posts/index");
            } else {
                let posts = [];
                for(var i=0;i<user.friends.length;i++){
                    for(var j=0;j<user.friends[i].posts.length;j++){
                        posts.push(user.friends[i].posts[j]);
                    }
                }
                for(var i=0;i<user.posts.length;i++){
                    posts.push(user.posts[i]);
                }
            }
        })
})