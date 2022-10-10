const User = require("../models/user")

module.exports = {
    loggedInAdmin: (req, res, next) => {
        if(req.session.user.type === "admin") {
            next()
        } else {
            req.flash("error", "You Need To Be Logged In To View This Page")
            res.redirect(`/users/login`)
        }
    },
    loggedInUser: (req, res, next) => {
        if(req.session.userid) {
            next()
        } else if(req.session.passport){
            next()
        } else {
            res.redirect(`/users/login`)
        }
    },
    assignSession: (req, res, next) => {
  var name;
  var message;

  try{
    passport = req.session.passport.user.id
  } catch {
    passport = undefined
  }
  if(passport !== undefined) {
    res.locals.id = passport
  } else {
    res.locals.id = req.session.userid
  }

  if(req.session.passport) {
     res.locals.user = req.session.passport.user.name
  } else {
     res.locals.user = req.session.name
  }
  console.log( res.locals, "RES LOCAL")

  next()
    },
    blockedUser: (req, res, next) => {
        let userId = req.session.userId
        User.findOne({_id: userId},(err, user) => {
            if(user.blocked === true){
                req.flash("message", "You are blocked")
                res.redirect(`/user/login`)
            } else {
                next()
            }
        })
    }
}