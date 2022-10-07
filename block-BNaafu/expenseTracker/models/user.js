var mongoose = require(`mongoose`)
var Schema = mongoose.Schema;
var bcrypt = require(`bcrypt`)
var Income = require(`../models/income`)
var Expense = require(`../models/expense`)



var userSchema = new Schema({
    fname: {type: String, required: true},
    email: {type: String, unique: true},
    password: {type: String, minlength: 5},
    age: Number, 
    phone: Number, 
    country: String,
    income: [{type:Schema.Types.ObjectId, ref:`Income`, default: []}],
    expense:[{type:Schema.Types.ObjectId, ref:`Expense`, default: []}],
    verified: false,
    uniqueStr: String
})

userSchema.pre(`save`, function(next){
    if(this.password && this.isModified(`password`)){
    bcrypt.hash(this.password, 10, (err, hashed) => {
        if(err) return next(err)
        this.password = hashed;
        return next()
    })
    } else {
        next();
    }
})

userSchema.methods.verifyPassword = function(password, cb){
    bcrypt.compare(password, this.password, (err, result) => {
        return cb(err, result)
    })
}


// userSchema.method.fullName = function(fname, lname, cb){
//     var fullName = this.fname + ` ` + this.lname;
//     return cb(err, fullName)
// }




module.exports = mongoose.model(`User`, userSchema)
