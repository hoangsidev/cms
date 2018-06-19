var mongoose = require('../configs/database.js');
var posts_schema = new mongoose.Schema({
    title: String,
    slug: String,
    content: String,
    excerpt: String,
    thumbnail: String,
    comments: [
        {
            _id: String,
            name: String,
            email: String,
            comment: String,
            active: String,
            created_at: String,
            updated_at: String
        }
    ],
    terms: [
        {
            _id: String
        }
    ],
    custom_fields: [],
    user_id: String,
    post_type_id: String,
    status: String,
    created_at: String,
    updated_at: String,
    num_order: String
});
// posts_schema.index({ title: 'text' }); // index search, use posts_schema.index({'$**': 'text'}); to index all
module.exports = mongoose.model('posts', posts_schema);  // posts là tên collecttion