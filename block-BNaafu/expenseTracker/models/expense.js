var mongoose = require(`mongoose`)
var Schema = mongoose.Schema;

var expenseSchema = new Schema({
    name: String,
    category: String, 
    amount: Number,
    date: Date,
    user: {type: Schema.Types.ObjectId, ref: "User"},
}, {timestamps: true})

module.exports = mongoose.model(`Expense`, expenseSchema, `expense`)
