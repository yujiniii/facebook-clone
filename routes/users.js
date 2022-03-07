const express = require('express');
const User = require("../models/User");
const multer = require("multer");
const cloudinary = require("cloudinary");
const { Passport } = require('passport/lib');
const router = express.Router();

//multer setup
const storage = multer.diskStorage({
    filename:(req,file,callback)=>{
        callback(null,Date.now() + file.originalname);
    }
});

const imageFilter = (req, file, callback) =>{
    if(!file.originalname.match(/\.(jpg|jpeg|png)$/i)){
        return callback(new Error("Only image files are allowed!!"), false);
    }
    callback(null,true);
};

const upload = multer({storage:storage, fileFilter:fileFilter});

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
    req.flash("error", "you need to be logged in to do that !! ");
    req.redirect("/user/login");
}

//routers

//userRouters
router.post("/user/register", uppload.single("image"), (req,res)=>{
    if(
        req.body.username &&
        req.body.firstname &&
        req.body.lastname &&
        req.body.password
    ){
        let newUser = new User({
            username : req.body.username,
            firstname : req.body.firstname,
            lastname:req.body.lastname
        });
        if(req.file){
            cloudinary.uploader.upload(req.file.path, result =>{
                newUser.profile = result.secure_url;
                return createUser(newUser, req.body.password, req, res);
            });
        }else {
            newUser.profile = process.env.DEFAULT_PROFILE_PIC;
            return createUser(newUser, req.body.password, req, res);
        }
    }
});

function createUser(newUser, password, req, res) {
    User.register(newUser, password, (err,user)=>{
        if(err) {
            req.flash("error", err.message);
            res.redirect("/");
        } else {
            passport.authenticate("local")(req, res, function(){
                console.log(req.user);
                req.flash(
                    "success",
                    "Success!!! YOU ARE REGISTERED AND LOGGED IN !"
                );
                res.redirect('/');
            })
        }
    })
}