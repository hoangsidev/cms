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
    error: (req, res, next) => {
        return res.render('backend/error', {
            site_info: {
                page_title: 'Error! An error occurred. Please try again later',
                page_slug: 'error',
                me: res.locals.me
            }
        });
    },
    not_found: (req, res, next) => {
        return res.render('backend/404', {
            site_info: {
                page_title: 'Not found',
                page_slug: '404',
                me: res.locals.me
            }
        });
    }
}
module.exports = backend_controller;