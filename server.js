const express = require('express');
const app = express();
const port = 8000;
const logger = require('morgan');
const path = require('path');
const flash = require('connect-flash');
const mongoose = require('mongoose');
const User = require('./models/User.js');
const bcrypt = require('bcryptjs');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const { globalVariables } = require('./config/globalConfig');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy
const { isLoggedIn } = require('./config/authorization')

// DB connection

mongoose.connect("mongodb://localhost/MyBlog")
    .then(response => console.log('Database Connected Successfully'))
    .catch(error => console.log(`Database connection: ${error}`))

// Cookie configuration
app.use(cookieParser());

// Session configuration
app.use(session({
    secret: 'jkjIHJOJbh*&546$%$*UH809()^&7654UGY^&',
    resave: true,
    saveUninitialized: true,
    cookie: {
        maxAge: Date.now() + 3600000
    },
    store: MongoStore.create({
        mongoUrl: 'mongodb://localhost/MyBlog',
        ttl: 365 * 24 * 60 * 60 // = 14 days. Default
    })
}));

// passport configuration
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy({ usernameField: 'email', passReqToCallback: true },
    async (req, email, password, done) => {
        await User.findOne({ email })
            .then((user) => {
                if (!user) {
                    return done(null, false, 
    req.flash('error-message', 'User not found. Please register and try again'))
              }
    bcrypt.compare(password, user.password, (err, passwordMatch) => {
        if(err){
            return err;
        }
        if(!passwordMatch)
         return done(null, false, req.flash('error-message', 'Incorrect Password'))
         return done(null, user, req.flash('success-message', 'Login Successfully'));  
          }); 

            });         
    }));

passport.serializeUser(function (user, done) {
    done(null, user.id);
});
passport.deserializeUser(function (id, done) {
    User.findById(id, function(err, user) {
        done(err, user)
    })
})





app.use(flash());
app.use(globalVariables);

// morgan setup
app.use(logger('dev'));

// set up View Engine to use EJS
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json())
app.use(express.urlencoded({ extended: true }))


app.get('/', (req, res) => {
    const allPosts = [
        {
            img: '/assets/images/Blogging-pana.svg',
            title: 'First Post',
            content: "Some quick example text to build on the card title and make up the bulk of the card's content."
        },

        {
            img: '/assets/images/image1.jpg',
            title: 'Second Post',
            content: "Some quick example text to build on the card title and make up the bulk of the card's content."
        },

        {
            img: '/assets/images/image1.jpg',
            title: 'Third Post',
            content: "Some quick example text to build on the card title and make up the bulk of the card's content."
        },

        {
            img: '/assets/images/image1.jpg',
            title: 'Card Title',
            content: "Some quick example text to build on the card title and make up the bulk of the card's content."
        },

        {
            img: '/assets/images/image1.jpg',
            title: 'Card Title',
            content: "Some quick example text to build on the card title and make up the bulk of the card's content."
        },

        {
            img: '/assets/images/image1.jpg',
            title: 'Card Title',
            content: "Some quick example text to build on the card title and make up the bulk of the card's content."
        },

        {
            img: '/assets/images/image1.jpg',
            title: 'Card Title',
            content: "Some quick example text to build on the card title and make up the bulk of the card's content."
        },

        {
            img: '/assets/images/image1.jpg',
            title: 'Card Title',
            content: "Some quick example text to build on the card title and make up the bulk of the card's content."
        }
    ];



    res.render('home', { allPosts });
});

app.get('/login', (req, res) => {
    res.render('login');
});

app.post('/user/login', passport.authenticate('local', {
    failureRedirect: '/login',
    successRedirect: '/',
    
    session: true
}) 

)


app.get('/register', (req, res) => {
    res.render('register');
});

app.post('/user/register', async (req, res) => {
    let {
        username,
        password,
        email,
        summary,
        image
    } = req.body;
 
    const userExist = await User.findOne({ email });
    if (userExist) {
        req.flash("error-message", "User already exist!!!");
        return res.redirect("back");
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
        username,
        email,
        password: hashedPassword,
        summary,
        image
    });

    await newUser.save();

    req.flash("success-message", "Registration successful!!!");
    res.redirect("/login");
});

app.get('/newpost', (req, res) => {
    res.render('newPost');
});

app.get('/viewpost', (req, res) => {
    res.render('viewPost');
});


app.get('/user/profile', isLoggedIn, (req, res) => {
    res.render('profile');
});

app.get('/user/logout', (req, res) => {
    req.logout( function(err) {
        if (err) return next(err) 
    req.flash('success-message', 'User logged out succcessfully')
    res.redirect('/login')
 
    })

})

app.listen(port, () => console.log(`Server running on ${port}`));

