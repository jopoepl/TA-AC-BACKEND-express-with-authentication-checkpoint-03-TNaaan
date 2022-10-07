var express = require('express');
const Admin = require('../models/admin');
var router = express.Router();

/* GET users listing. */

/* GET -- SIGNUP PAGE FOR ADMIN. */
router.get('/signup', function(req, res, next) {
  res.render(`adminSignup`);
});

/* POST -- SIGNUP PAGE FOR ADMIN. */
router.post(`/signup`, function(req, res, next){
    Admin.create(req.body, (err, admin) => {
        if (err) next(err)
        req.flash(`success`, `Signup Successful`)
        console.log("FLASH MESSAGE", req.flash)
        res.redirect(`/admin/login`)
    })
})


/* GET -- DASHBOARD PAGE FOR ADMIN. */
router.get('/dashboard', function(req, res, next) {
    let username = req.session.name
    let type = req.session.type
    if(type === "admin"){
      res.render(`adminDashboard`, {name: username})
    } else if(type === "user") {
      res.redirect(`/users/dashboard`)
    } else {
      req.flash("error", "Login First")
      res.redirect(`/admin/login`)
    }
  });

/* GET LOGIN PAGE FOR ADMIN. */
router.get('/login', function(req, res, next) {
    res.render(`adminLogin`, {message: req.flash(`error`)});
});

/* POST - Handle LOGIN FOR ADMIN. */
router.post(`/login`, function(req, res, next) {
    var {email, password} = req.body;
    if (!email || !password) {
     req.flash("message", "Email or Password cannot be empty")
      return res.redirect(`/admin/login`)
    }
    Admin.findOne({email: email}, (err, admin) => {
        if(err) return next(err) //no admin
        console.log(admin, "admin")
        if(!admin){
          req.flash("message", "admin not found")
          return res.redirect(`/admin/login`)
        }
    admin.verifyPassword(password, (err, result) => {
            if(!result) {
              if(err) next(err);
              req.flash("message", "Incorrect password")
              return res.redirect(`/admin/login`)
            }
            if(err) next(err);
        req.session.adminId = admin._id
        req.session.name = admin.fname
        req.session.type = "admin";
        let adminname = admin.fname
        Admin.findOne({email: email},(err, admin)=> {
            res.redirect(`/admin/dashboard`)
          })
       })
    })
})

/* GET -- LOGGING OUT ADMIN */

router.get(`/logout`, (req, res, next) => {
    req.session.destroy();
     res.redirect(`/admin/login`)
  })








module.exports = router;