var m_posts = require('../backend/posts_controller.js');
var m_users = require('../../models/users_model.js');
var frontend_controller = {
    index: (req, res, next) => {
        res.render('frontend/index', {
            site_info: {
                page_title: 'Home',
                page_slug: 'index'
            }
        });
    }
}
module.exports = frontend_controller;