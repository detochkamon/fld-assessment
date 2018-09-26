const express = require('express');
const path = require('path');
const os = require('os');
const config = require('./config');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const UserSchema = require('./schemas/UserSchema');
const app = express();
const expressSession = require('express-session');
const ensureLoggedIn = require('connect-ensure-login').ensureLoggedIn;

const GenericResponse = require('../GenericResponse');

mongoose.connect(config.db.connectionString);

app.use(expressSession({ secret: 'keyboard cat', resave: false, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('dist'));

const User = mongoose.model('User', UserSchema);

passport.use(new LocalStrategy(
    function(username, password, done) {
        User.findOne({username}).then((user) => {
            const result = user && user.checkPassword(password);
            if (result) {
                done(null, user);
            } else {
                done(null, false, {errorCode:GenericResponse.INVALID_USERNAME_OR_PASSWORD});
            }
        }).catch((error) => {
            done(error);
        });
    }
));
passport.serializeUser(function(user, done) {
    done(null, user.id);
});

passport.deserializeUser(function(id, done) {
    User.findById(id).then((user) => {
        done(null, user);
    }).catch((error) => {
        done(error);
    });
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname + '../../../dist/index.html'));
});
app.post('/api/checkLoggedIn', (req, res) => {
    if (req.user) {
        res.send(GenericResponse.success({username: req.user.username}));
    } else {
        res.send(GenericResponse.fail());
    }
});
app.post('/api/register', (req, res) => {
    const username = req.body.username && req.body.username.trim();
    const password = req.body.password;
    const fullname = req.body.fullname;

    if (username) {
        User.find({username: username}).then((users) => {
            if (users.length) {
                res.send(GenericResponse.fail(null, GenericResponse.INVALID_USERNAME));
            } else {
                if (password && password.trim()) {
                    const user = new User({fullname, username, password});
                    user.hashPassword();
                    user.save().then(() => {
                        res.send(GenericResponse.success());
                    }).catch((e) => {
                        res.send(GenericResponse.fail(null, GenericResponse.UNKNOWN_ERROR));
                    });
                } else {
                    res.send(GenericResponse.fail(null, GenericResponse.INVALID_PASSWORD));
                }
            }
        }).catch((error) => {
            res.send(GenericResponse.fail(null, GenericResponse.UNKNOWN_ERROR));
        });
    } else {
        res.send(GenericResponse.fail(null, GenericResponse.INVALID_USERNAME));
    }
});
app.post('/api/authenticate', 
    passport.authenticate('local'),
    function(req, res) {
        res.send(GenericResponse.success());
    }
);
app.get('/api/deauthenticate', (req, res) => {
    req.logout();
    res.send(GenericResponse.success());
});
app.post('/api/check-username', (req, res) => {
    const username = req.body.username;
    User.findOne({username}).then((user) => {
        if (user) {
            res.send(GenericResponse.success({occupied: true}));
        } else {
            res.send(GenericResponse.success({occupied: false}))
        }
    }).catch((error) => {
        res.send(GenericResponse.fail(null, GenericResponse.UNKNOWN_ERROR));
    });
});
app.listen(8080, () => console.log('Listening on port 8080!'));