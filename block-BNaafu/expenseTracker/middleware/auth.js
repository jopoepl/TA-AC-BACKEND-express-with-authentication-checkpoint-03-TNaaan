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
        } if(req.session.passport.user){
            next()
        } else {
            req.flash("error", "You Need To Be Logged In To View This Page")
            res.redirect(`/users/login`)
        }
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