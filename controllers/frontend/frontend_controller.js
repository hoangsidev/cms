var configs = require('../../configs/configs.js'),
    m_posts = require('../../models/posts_model.js'),
    m_users = require('../../models/users_model.js'),
    m_terms = require('../../models/terms_model.js'),
    app = configs.app(),
    express = configs.express(),
    session = configs.session(),
    md5 = configs.md5(),
    fs = configs.fs(),
    path = configs.path(),
    formidable = configs.formidable(),
    app = configs.app(),
    body_parser = configs.body_parser(),
    slugify = configs.slugify(),
    get_site_url = configs.get_site_url(),
    get_admin_url = configs.get_admin_url(),
    get_site_name = configs.get_site_name();

app.use(body_parser.json());
app.use(body_parser.urlencoded({ extended: true }));


const promise_posts = () => {
    return new Promise((resolve, reject) => {
        m_posts.find({}).exec((err, posts) => {
            resolve(posts);
        });
    });
}

const app_globals = async () => {
    var app_globals = {},
        posts = await promise_posts();
    app_globals.posts = posts;
    app_globals.navs = 'menu';
    return Promise.resolve(app_globals);
}


var frontend_controller = {
    index: (req, res, next) => {
        app_globals().then((app_globals) => {
            res.render('frontend/index', {
                site_info: {
                    page_title: 'Home',
                    page_slug: 'index',
                    navs: app_globals.navs
                }
            });
        });







    }
}
module.exports = frontend_controller;