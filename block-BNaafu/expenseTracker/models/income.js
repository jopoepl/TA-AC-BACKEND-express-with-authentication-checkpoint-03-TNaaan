var mongoose = require(`mongoose`)
var Schema = mongoose.Schema;

var incomeSchema = new Schema({
    name: String,
    category: String, 
    amount: Number,
    date: Date,
    user: {type: Schema.Types.ObjectId, ref: "User"},
}, {timestamps: true})

module.exports = mongoose.model(`Income`, incomeSchema, `income`)
