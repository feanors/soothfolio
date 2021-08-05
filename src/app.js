const express = require("express");
const ccData = require("./cc-api");
const cryptor = require("./cryptor")
const userHandler = require("./user.js");
const mongoose = require("mongoose");
const passport = require("passport");
const session = require('express-session')
const passportLocalMongoose = require("passport-local-mongoose");

require('dotenv').config();

// -------------------------------- begin init --------------------------------

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static("public"));
app.set("view engine", "ejs");

app.use(session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

let hostedMongo = "mongodb+srv://feanor:" + process.env.DBKEY + "@cluster0.icwho.mongodb.net/ccDB";

mongoose.connect(hostedMongo, {
    useUnifiedTopology: true,
    useNewUrlParser: true,
    useCreateIndex: true
});


const userSchema = new mongoose.Schema ( {
    username: String,
    password: String,
});

const coinSchema = new mongoose.Schema({
    buffer: String,
    coinMap: Object
})

userSchema.plugin(passportLocalMongoose);

const CoinSchema = new mongoose.model("usercoin", coinSchema);
const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

var allCoinz = new Map();

// false below is for the boolean "priceOnly"
ccData.getAllCoinData(allCoinz, false);

// --------------------------------- end init ---------------------------------

app.get("/", (req, res) => req.isAuthenticated() ? res.redirect("/app") : res.render("home"));
app.get("/login", (req, res) => req.isAuthenticated() ? res.redirect("/app") : res.render("login"));
app.get("/register", (req, res) => req.isAuthenticated() ? res.redirect("/app") : res.render("register"));
app.get("/logout", (req, res) => { req.logout(); res.redirect("/") });
app.post("/login", passport.authenticate("local", { successRedirect: "/app", failureRedirect: "/" }));

app.post("/register", (req, res) => {
    User.register({ username: req.body.username }, req.body.password, (err, user) => {
        if (err) {
            res.redirect("/register");
        } else {
            passport.authenticate("local")(req, res, () => {
                map = new Map();
                ecd = cryptor.encrypt(JSON.stringify([...map.entries()]));
                CoinSchema.create( {buffer: req.user.username, coinMap: ecd});
                res.redirect("/app");
            });
        }
    });
});

app.get("/app", (req, res) => {

    if (!req.isAuthenticated()) {
        res.redirect("/");
    } else {
        // true below is for the boolean "priceOnly"
        ccData.getAllCoinData(allCoinz, true);

        userHandler.fetchUserCoinMap(CoinSchema, req.user.username, allCoinz, (userCoinMap) => {
            res.render("portfolio", {
                coinz : userCoinMap,
                allCoinz : allCoinz,
                totalWorth : userHandler.totalWorth(userCoinMap),
                totalGainz : userHandler.totalGainz(userCoinMap)
            });
        });
        
    }  
});

app.post("/add", (req, res) => {
    
    if(req.isAuthenticated()) {
        let id = req.body.coinName;
        let amnt = parseFloat(req.body.coinAmount);
        let date = req.body.datePurchased;
        let userID = req.user.username;
        
        if(!date || !id || !amnt || amnt <= 0) {
            res.redirect("/app");
        } else {
            userHandler.updateCoinAmount(CoinSchema, amnt, id, formatDate(date), userID, () => {
                res.redirect("/app");
            });
        }
    } else {
        res.redirect("/");
    } 
});

app.post("/remove", (req, res) => {
    if(req.isAuthenticated()) {
        let id = req.body.coinName;
        let amnt = -parseFloat(req.body.coinAmount);
        let userID = req.user.username;
        
        if(!id || !amnt || amnt >= 0) {
            res.redirect("/app");
        } else {
            userHandler.updateCoinAmount(CoinSchema, amnt, id, null, userID, () => {
                res.redirect("/app");
            });
        }
    } else {
        res.redirect("/");
    } 
})

function formatDate (input) {
    var datePart = input.match(/\d+/g);
    year = datePart[0];
    month = datePart[1], day = datePart[2];
  
    return day+'-'+month+'-'+year;
}

app.listen(process.env.PORT || 3000, () => {
    console.log("Server started.");
});