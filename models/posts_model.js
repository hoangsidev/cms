var mongoose = require('../config/database.js');
var posts_schema = new mongoose.Schema({
    title: String,
    slug: String,
    content: String,
    excerpt: String,
    thumbnail: String,
    comments: [],
    terms: [],
    custom_fields: [],
    author_id: String,
    post_type_id: String,
    status: String,
    created_at: String,
    updated_at: String,
    num_order: String
});
module.exports = mongoose.model('posts', posts_schema);  // posts là tên collecttion