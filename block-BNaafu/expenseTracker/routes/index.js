var express = require('express');
var router = express.Router();
const passport = require(`passport`);
const User = require('../models/user');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express', name: null });
});

module.exports = router;


/* GET - OAUTH LOGIN PROCESS */

router.get('/auth/github', passport.authenticate(`github`, {scope:[ 'user:email' ]}))

router.get('/auth/google', passport.authenticate(`google`, { scope: ['profile', `email`] }))

router.get('/auth/github/callback', passport.authenticate(`github`, {failureRedirect: `/failure`}), (req, res) => {
  res.redirect(`/users/dashboard`)
})

router.get('/oauth2/redirect/google', 
  passport.authenticate('google', { failureRedirect: '/' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect(`/users/dashboard`);
  });


// Handling Dashboard route

router.get('/dashboard', function(req, res, next) {
  console.log(req.session, "REQ SESSION DASH")
  let type = "";
  if(req.session.passport) {
     type = req.session.passport.user.type
  } else {
    type = req.session.type
  }
  console.log(type, "type")
  if(type === "user"){
    res.redirect(`/users/dashboard`)
  } else if (type === "admin") {
    res.redirect(`/admin/dashboard`)
  } else {
    req.flash("message", "Login with a User Account")
    res.redirect(`/users/login`)
  }
});

router.get(`/verify/:uniqueStr`, async (req, res) => {
  const uniqueStr = req.params.uniqueStr;
  const user = await User.findOne({uniqueStr: uniqueStr})
  if(user) {
    user.verified = true
    await user.save()
    res.redirect(`/users/login`)
  } else {
    res.json(`User not found!`)
  }
})