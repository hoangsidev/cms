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
    get_site_name = configs.get_site_name(),
    progress_post = promise.progress_post,
    progress_posts = promise.progress_posts,
    app_globals = promise.app_globals;

app.use(body_parser.json());
app.use(body_parser.urlencoded({ extended: true }));



var frontend_controller = {
    errors: (req, res, next) => {
        app_globals().then((app_globals) => {
            return res.render('frontend/errors', {
                app_globals: app_globals,
                site_info: {
                    page_title: 'Errors',
                    page_slug: 'errors'
                }
            });
        });
    },
    not_found: (req, res, next) => {
        app_globals().then((app_globals) => {
            return res.render('frontend/404', {
                app_globals: app_globals,
                site_info: {
                    page_title: 'Not found!',
                    page_slug: '404'
                }
            });
        });
    },

    /* ------- */

    index: (req, res, next) => {
        app_globals().then((app_globals) => {
            return res.render('frontend/index', {
                app_globals: app_globals,
                site_info: {
                    page_title: 'Home',
                    page_slug: 'index'
                }
            });
        });
    },

    single: (req, res, next) => {
        if (req.params.slug && req.params.slug != null && req.params.slug != '' && typeof req.params.slug !== 'undefined') {
            var slug = req.params.slug,
                arr_slug = slug.split('-'),
                _id = arr_slug[arr_slug.length - 1];
        }; // tách id từ slug
        if (_id) {
            m_posts.findOne({ _id: _id }, (err, result) => {
                if (result) {
                    result = JSON.parse(JSON.stringify(result));
                    progress_post(result).then((post) => {
                        app_globals().then((app_globals) => {
                            return res.render('frontend/single', {
                                app_globals: app_globals,
                                post: post,
                                site_info: {
                                    page_title: result.title,
                                    page_slug: result.slug,
                                    post_type: 'posts'
                                }
                            });
                        });
                    });
                } else {
                    return res.redirect(get_site_url + '/404');
                }
            });
        }
    },

    get_articles_by_term: (req, res, next) => {
        if (req.params.slug && req.params.slug != null && req.params.slug != '' && typeof req.params.slug !== 'undefined') {
            var slug = req.params.slug,
                arr_slug = slug.split('-'),
                _id = arr_slug[arr_slug.length - 1];
        }; // tách id từ slug
        if (_id) {
            m_posts.find({ 'terms._id': _id, post_type_id: '1' }, (err, results) => {
                if (results) {
                    results = JSON.parse(JSON.stringify(results));
                    progress_posts(results).then((articles_by_term) => {
                        app_globals().then((app_globals) => {
                            return res.render('frontend/archive', {
                                app_globals: app_globals,
                                articles_by_term: articles_by_term,
                                site_info: {
                                    page_title: 'Archive',
                                    page_slug: 'archive',
                                    post_type: 'posts'
                                }
                            });
                        });
                    });
                } else {
                    return res.redirect(get_site_url + '/404');
                }
            });
        }
    },

}
module.exports = frontend_controller;