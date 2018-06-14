var mongoose = require('../configs/database.js');
var terms_schema = new mongoose.Schema({
    title: String,
    slug: String,
    description: String,
    thumbnail: String,
    taxonomy_id: String,
    num_order: String
});
module.exports = mongoose.model('terms', terms_schema);  // posts là tên collecttion