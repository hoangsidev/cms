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


app.use((req, res, next) => {
    res.locals.navs = 'menu';
    return next();
});

var frontend_controller = {
    index: (req, res, next) => {
        console.log(res.locals.navs);
        res.render('frontend/index', {
            site_info: {
                page_title: 'Home',
                page_slug: 'index'
            }
        });
    }
}
module.exports = frontend_controller;