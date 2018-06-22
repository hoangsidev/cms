var m_users = require('../../models/users_model.js');
var backend_controller = {
    dashboard: (req, res, next) => {
        return res.render('backend/dashboard', {
            site_info: {
                page_title: 'Dashboard',
                page_slug: 'dashboard',
                me: res.locals.me
            }
        });
    },
    configs: (req, res, next) => {
        return res.render('backend/configs', {
            site_info: {
                page_title: 'Configs',
                page_slug: 'configs',
                me: res.locals.me
            }
        });
    },
    errors: (req, res, next) => {
        return res.render('backend/errors', {
            site_info: {
                page_title: 'Error!',
                page_slug: 'errors',
                me: res.locals.me
            }
        });
    },
    not_found: (req, res, next) => {
        return res.render('backend/404', {
            site_info: {
                page_title: 'Not found!',
                page_slug: '404',
                me: res.locals.me
            }
        });
    },
    access_denied: (req, res, next) => {
        return res.render('backend/access_denied', {
            site_info: {
                page_title: 'Access denied',
                page_slug: 'access_denied',
                me: res.locals.me
            }
        });
    }
}
module.exports = backend_controller;