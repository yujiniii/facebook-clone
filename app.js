const express = require('express');
const mongoose = require('mongoose');
const session = require("express-session");
const cookieParser = require('cookie-parser');
const passport = require('passport');
const Localstrategy = require('passport-local');
const socket = require('socket.io');
const path = require('path'); 
const dotenv = require('dotenv');
const flash = require('connect-flash');
const Post = require('./models/Post');
const User = require('./models/User');


const port = process.env.PORT || 3000;
const onlineChatUsers = {};

dotenv.config();

const postRoutes = require('./routes/posts');
const userRoutes = require('./routes/users');
const { emit, on } = require('nodemon');

const app = express();

app.set('view engine', 'ejs'); 
app.set('views', path.join(__dirname, "/views")); 
app.use(express.static('public'));
console.log(__dirname);
// 미들웨어
const sessop = {
    secret:process.env.SECRET,
    resave:false,
    saveUninitialized:false,
    cookie: {
        httpOnly: true,
        secure: false,
    },
};
app.use(cookieParser(process.env.SECRET));
app.use(session(sessop));
app.use(flash());

// passport setup
app.use(passport.initialize());
app.use(passport.session());
passport.use(new Localstrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

//middle ware
app.use(express.json());
app.use(express.urlencoded({extended:true}));


//mongoDB Connection
mongoose
    .connect("mongodb://127.0.0.1:27017/facebook_clone",{
        //true로 넣어줘야 error가 안남
        useNewUrlParser:true,
        useCreateIndex:true,
        useUnfiedTopology:true
    })
    .then(()=>{
        console.log("connect to MongoDB");
    })
    .catch((err)=>{
        console.log(err);
    });

//template 파일에 변수 전송
app.use((req,res,next)=>{
    res.locals.user = req.user;
    res.locals.login = req.isAuthenticated();
    res.locals.error = req.flash("error");
    res.locals.success = req.flash("success");
    next();
});

//Routers
app.use('/', userRoutes);
app.use('/',postRoutes);

// server
const server = app.listen(port, ()=>{
    console.log("APP is running on port " + port);
});

// websocket
const io = socket(server);

const room = io.of("/chat");

// 모든 사용자에게 보내는 메세지, .. 채팅방 기본 알림 같은거(000님이 입장하였습니다..)
room.on("connection", socket=>{
    console.log("new user : ", socket.id);

    room.emit("newUser",{socketID : socket.id});

    socket.on("newUser",data => {
        if(!(data.name in onlineChatUsers)){
            onlineChatUsers[data.name] = data.socketID;
            socket.name = data.name;
            room.emit("updateUserList", Object.keys(onlineChatUser));
            console.log("online users : "+Object.keys(onlineChatUsers));
        }
    });
    socket.on("disconnect", ()=>{
        delete onlineChatUsers[socket.name];
        room.emit("updateUserList", Object.keys(onlineChatUsers));
        console.log(`user ${socket.name} disconnected`);
    });

    socket.on("chat", data => {
        console.log(data);
        if(data.to === "Global Chat"){
            room.emit("chat",data);
        }else if(data.to){
            room.to(onlineChatUsers[data.name]).emit("chat", data);
            room.to(onlineChatUsers[data.to]).emit("chat", data);
        }
    });
});

