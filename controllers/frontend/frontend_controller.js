var configs = require('../../configs/configs.js'),
    m_posts = require('../../models/posts_model.js'),
    m_users = require('../../models/users_model.js'),
    m_terms = require('../../models/terms_model.js'),
    promise = require('../components/promise.js'),
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
app_globals = promise.app_globals;

app.use(body_parser.json());
app.use(body_parser.urlencoded({ extended: true }));



var frontend_controller = {
    errors: (req, res, next) => {
        return res.render('frontend/errors', {
            site_info: {
                page_title: 'Error!',
                page_slug: 'errors',
                me: res.locals.me
            }
        });
    },
    not_found: (req, res, next) => {
        return res.render('frontend/404', {
            site_info: {
                page_title: 'Not found!',
                page_slug: '404',
                me: res.locals.me
            }
        });
    },
    access_denied: (req, res, next) => {
        return res.render('frontend/access_denied', {
            site_info: {
                page_title: 'Access denied',
                page_slug: 'access_denied',
                me: res.locals.me
            }
        });
    },

    /* ------- */

    index: (req, res, next) => {
        app_globals().then((app_globals) => {
            res.render('frontend/index', {
                app_globals: app_globals,
                site_info: {
                    page_title: 'Home',
                    page_slug: 'index'
                }
            });
        });
    },

    single: (req, res, next) => {
        if (req.params._id && req.params._id != null && req.params._id != '' && typeof req.params._id !== 'undefined') { var _id = req.params._id };
        console.log(_id);
        if (_id) {
            m_posts.findOne({ _id: _id }, (err, result) => {
                if (result) {
                    console.log(result);
                } else {
                    return res.redirect(get_site_url + '/404');
                }
            });
        }
    }
}
module.exports = frontend_controller;