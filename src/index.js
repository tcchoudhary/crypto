// ! required all midllwear on this project

const env = require('dotenv').config();
const mongoose= require("mongoose");
mongoose.set('strictQuery', true);
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy
const passportlocalmongoose = require('passport-local-mongoose');
const LocalStrategy = require('passport-local');
const findorcreate = require('mongoose-findorcreate');
const passport = require('passport');
const md5 =require('md5');
const express = require('express');
const session = require('express-session');
const ejs = require('ejs');
const app = express();


// ? connect to database with mongoose

mongoose.connect("mongodb://127.0.0.1:27017/crypto").then(()=>{
    console.log("mongoose connected successfully")
}).catch((error)=>{
    console.log(error.message);
});


// TODO userschema 

const userSchema= new mongoose.Schema({
    username:String,
    githubID:String,
   googleID:String,
    password:String,
    email:String,
    pic:String,
    date:{
        type:Date,
        default: Date.now
    },
});

userSchema.plugin(findorcreate);

// TODO  modul based on userschema 
const userData= new mongoose.model("user",userSchema);


// ! use midllwear 
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.urlencoded({extended:true}));

// ? express-session create
app.use(session({
    secret:'askl;dfjaskl;dfjasdf',
    resave:false,
    saveUnitialized:false
}));

// session createdd

app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user,cb)=>{
    return cb(null, user);
});

passport.deserializeUser((user,cb)=>{
  return cb(null, user)
});



passport.use(new GoogleStrategy({
    clientID:process.env.GOOGLE_CLIENT_ID,
    clientSecret:process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:8000/auth/google/cb"
  },
  function(accessToken, refreshToken, profile, cb) {
    // process.nextTick(function () {
    //     return cb(null, profile);
    //   });
    userData.findOrCreate({ googleId: profile.id,username:profile.displayName,pic:profile.photos[0].value,email:profile.emails[0].value }, function (err, user) {
        return cb(err, user);
      });
  }
));

passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: "http://127.0.0.1:8000/auth/github/cb"
  },
  function(accessToken, refreshToken, profile, cb) {
    // process.nextTick(function () {
    //     return done(null, profile);
    //   });
    // console.log(profile);
    userData.findOrCreate({ googleId: profile.id,username:profile.displayName,pic:profile.photos[0].value}, function (err, user) {
        return cb(err, user);
      });
  }
));

//passport local authentication strategy

passport.use(new LocalStrategy(
    function(username, password, done) {
      userData.findOne({ username: username }, function (err, user) {
        if (err) { return done(err); }
        if (!user) { return done(null, false); }
        if (!user.verifyPassword(password)) { return done(null, false); }
        console.log(user);
        return done(null, user);
      });
    }
  ));

// ? link bassed route 

app.get('/auth/google',passport.authenticate('google',{scope: ['profile','email']}));
app.get('/auth/github',passport.authenticate('github', { scope: [ 'profile','email' ] }));


app.post('/login', 
  passport.authenticate('local', { failureRedirect: '/login' }),
  function(req, res) {
    res.redirect('/');
  });



app.get('/auth/google/cb', passport.authenticate('google',{failureRedirect:'/login'}),(req,res)=>{
    res.redirect('/');
    
})

app.get('/auth/github/cb', passport.authenticate('github',{failureRedirect:'/login'}),(req,res)=>{
    res.redirect('/')
})


app.get('/',(req,res)=>{
    res.render('home')
})

app.get('/profile',(req,res)=>{
        res.render('profile',{user:req.user,})  
});




app.route('/register')
.get((req, res)=>{
    res.render('register')
  })
.post((req,res)=>{
   const  Email = req.body.usermail;
    userData.findOne({email: Email}, (err, founduser)=>{
        if(err)
        {
            console.log(err);
        }
         else{
             if(founduser)
             {
                res.send('user already exists');
            }
                else{
                        const newUser = new userData({
                            email: req.body.usermail,
                            password:md5(req.body.password),
                            name:req.body.username
                        });             
                        newUser.save(err=>{
                            if(err){
                                console.log(err);
                            }
                                res.redirect('/');
                        })
                    }
            }
        }
    )
})

app.route('/login')
.get((req,res)=>{
        res.render('login')
        
})
.post((req,res)=>{
     const email = req.body.usermail;
     const password = md5(req.body.password1)
     userData.findOne({email:email},(err,found)=>{
        if(err){
            console.log(err);
        }
        else{
            if (found){
                if (found.password === password) 
                res.redirect('/')
                else
                res.send('password not match')
            }}
     })
});




app.get('/logout', (req,res)=>{
    req.logOut((err)=>{
        if(err){
            console.log(err);
        }else{
            res.redirect('/login');
        }
    })
});



app.get('/about', (req,res)=>{
            res.render('about') 
    });


app.get('/service', (req,res)=>{
   
        res.render('service')
    });

app.get('/roadmap', (req,res)=>{
   
        res.render('roadmap')
    
    });

app.get('/team', (req,res)=>{
  
        res.render('team')
   
    // req.isAuthenticated ? res.render('team') : res.redirect('/login');

    });

app.get('/contact', (req,res)=>{
  
        res.render('contact')
   
    });





app.listen(8080,()=>{
    console.log('server is ready');
});
