var mongoose = require(`mongoose`)
var Schema = mongoose.Schema;

var categorySchema = new Schema({
    name: {type: String, unique: true}, 
    categoryType: {type: String}
})

categorySchema.index({categoryType: 1})

module.exports = mongoose.model(`Category`, categorySchema)

