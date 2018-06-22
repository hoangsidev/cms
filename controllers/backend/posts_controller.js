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
    progress_posts = promise.progress_posts;
app.use(body_parser.json());
app.use(body_parser.urlencoded({ extended: true }));

var page_404 = get_admin_url + '/404', page_errors = get_admin_url + '/errors';

const exist_post_type = (slug) => {
    var post_type, post_type_id;
    if (slug && slug != null && slug != '' && typeof slug !== 'undefined' && (slug == 'articles' || slug == 'pages')) {
        if (slug == 'articles') { post_type_id = '1'; } else if (slug == 'pages') { post_type_id = '2'; }
        return post_type = {
            post_type_slug: slug,
            post_type_id: post_type_id
        }
    } else { return false; }
}

const exist_slug = (slug) => {
    return new Promise((resolve, reject) => {
        m_posts.findOne({ slug: slug }, (err, exist) => {
            if (exist != null) {
                resolve(exist_slug(slug + '-2'));
            } else if (exist == null) {
                resolve(slug);
            }
        });
    });
}

var posts_controller = {
    // CURD
    posts: (req, res, next) => {  // done
        // check exist post_type
        if (exist_post_type(req.params.post_type)) {
            var post_type = exist_post_type(req.params.post_type), post_type_slug = post_type.post_type_slug, post_type_id = post_type.post_type_id;
        } else {
            return res.redirect(page_404);
        }
        // end check exist post_type
        if (req.query.search && req.query.search != null && req.query.search != '' && typeof req.query.search !== 'undefined') { var key_search = req.query.search };
        var per_page = 20, // num of post in one page
            page = (req.params.page && req.params.page != null && req.params.page != '' && typeof req.params.page !== 'undefined' && !isNaN(req.params.page)) ? req.params.page : 1;
        if (!key_search) { // list all
            var regex;
            if (res.locals.me && res.locals.me.role == 0) { // chỉ cho xem bài viết của mình
                regex = {
                    post_type_id: post_type_id,
                    user_id: res.locals.me
                };
            } else {
                regex = {
                    post_type_id: post_type_id
                };
            }
            m_posts.find(regex).skip((per_page * page) - per_page).limit(per_page).exec((err, results) => {
                results = JSON.parse(JSON.stringify(results));
                progress_posts(results).then((posts) => {
                    m_posts.find(regex).count().exec((err, count) => {
                        return res.render('backend/posts/posts', {
                            posts: posts ? posts : [],
                            current: page,
                            pages: Math.ceil(count / per_page),
                            paginate: (count > per_page) ? true : false,
                            site_info: {
                                page_title: 'All ' + post_type_slug,
                                page_slug: post_type_slug,
                                post_type: post_type,
                                me: res.locals.me
                            }
                        });
                    });
                });
            });
        } else { // if search

            var regex;
            if (res.locals.me && res.locals.me.role == 0) { // chỉ cho phép tìm kiếm bài viết của mình
                regex = {
                    $and: [{ post_type_id: post_type_id, user_id: res.locals.me }, {
                        $or: [
                            { title: new RegExp(key_search, "i") }, // thêm '^' +  : là search bắt đầu bằng từ khóa
                            { slug: new RegExp(key_search, "i") },
                            { content: new RegExp(key_search, "i") }
                        ]
                    }]
                };
            } else {
                regex = {
                    $and: [{ post_type_id: post_type_id }, {
                        $or: [
                            { title: new RegExp(key_search, "i") },
                            { slug: new RegExp(key_search, "i") },
                            { content: new RegExp(key_search, "i") }
                        ]
                    }]
                };
            }

            m_posts.find(regex).skip((per_page * page) - per_page).limit(per_page).exec((err, results) => {
                results = JSON.parse(JSON.stringify(results));
                progress_posts(results).then((posts) => {
                    m_posts.find(regex).count().exec((err, count) => {
                        return res.render('backend/posts/posts', {
                            posts: posts ? posts : [],
                            current: page,
                            pages: Math.ceil(count / per_page),
                            key_search: key_search,
                            count_result: count,
                            paginate: count > per_page ? true : false,
                            site_info: {
                                page_title: 'Search results ' + post_type_slug,
                                page_slug: post_type_slug,
                                post_type: post_type,
                                me: res.locals.me
                            }
                        });
                    });
                });
            });
        }
    },

    create: (req, res, next) => { // done
        // check exist post_type
        if (exist_post_type(req.params.post_type)) {
            var post_type = exist_post_type(req.params.post_type), post_type_slug = post_type.post_type_slug, post_type_id = post_type.post_type_id;
        } else {
            return res.redirect(page_404);
        }
        // end check exist post_type
        if (req.method == 'GET') {
            m_terms.find({}).exec((err, terms) => {
                terms = JSON.parse(JSON.stringify(terms));
                return res.render('backend/posts/create', {
                    terms: terms ? terms : [],
                    site_info: {
                        page_title: 'Add new ' + post_type_slug.substring(0, post_type_slug.length - 1), // bỏ chữ s cuối, ví dụ Add new post(s)
                        page_slug: 'create_' + post_type_slug,
                        post_type: post_type,
                        me: res.locals.me
                    }
                });
            });
        } else if (req.method == 'POST') {
            var form = new formidable.IncomingForm(); form.maxFileSize = 20 * 1024 * 1024; // 20MB
            form.parse(req, (err, fields, files) => {
                if (fields.title && fields.title != null && fields.title != '' && typeof fields.title !== 'undefined') { var title = fields.title };
                if (fields.post_type_id && fields.post_type_id != null && fields.post_type_id != '' && typeof fields.post_type_id !== 'undefined') { var post_type_id = fields.post_type_id };
                if (title && post_type_id) {
                    var arr_data = new Object(),
                        slug = slugify(fields.title, { replacement: '-', remove: /[$*_+~.()'"!\-:@]/g, lower: true });
                    exist_slug(slug).then((result_slug) => {
                        arr_data.title = fields.title;
                        arr_data.slug = result_slug ? result_slug : slug;
                        arr_data.content = (fields.content && fields.content != null && fields.content != '' && typeof fields.content !== 'undefined') ? fields.content : null;
                        arr_data.excerpt = (fields.excerpt && fields.excerpt != null && fields.excerpt != '' && typeof fields.excerpt !== 'undefined') ? fields.excerpt : null;
                        if (files.thumbnail.name) {
                            var name_file = md5(Math.random().toString()),
                                oldpath = files.thumbnail.path,
                                type_file = (files.thumbnail.name.split('.'))[1],
                                newpath = path.resolve('assets/backend/uploads/' + name_file + '.' + type_file);
                            fs.rename(oldpath, newpath, (err) => { });
                            arr_data.thumbnail = name_file + '.' + type_file;
                        } else {
                            arr_data.thumbnail = null;
                        };
                        arr_data.comments = (fields.comments && fields.comments != null && fields.comments != '' && typeof fields.comments !== 'undefined') ? fields.comments : [];
                        if (fields.terms && fields.terms != null && fields.terms != '' && typeof fields.terms !== 'undefined') {
                            var arr_terms = (fields.terms).split(','), terms = [];
                            for (var i in arr_terms) {
                                var term = {};
                                term._id = arr_terms[i];
                                terms.push(term)
                            }
                            arr_data.terms = terms;
                        } else {
                            arr_data.terms = [];
                        }
                        arr_data.custom_fields = (fields.custom_fields && fields.custom_fields != null && fields.custom_fields != '' && typeof fields.custom_fields !== 'undefined') ? fields.custom_fields : [];
                        arr_data.user_id = (res.locals.me._id).toString();
                        arr_data.post_type_id = (fields.post_type_id && fields.post_type_id != null && fields.post_type_id != '' && typeof fields.post_type_id !== 'undefined') ? fields.post_type_id : '1';
                        if (res.locals.me.role == 0) {
                            arr_data.status = '0';
                        } else {
                            arr_data.status = (fields.status && fields.status != null && fields.status != '' && typeof fields.status !== 'undefined') ? fields.status : '0';
                        }
                        arr_data.post_type_id = fields.post_type_id;
                        arr_data.created_at = new Date();
                        arr_data.updated_at = null;
                        arr_data.num_order = (fields.num_order && fields.num_order != null && fields.num_order != '' && typeof fields.num_order !== 'undefined') ? fields.num_order : '0';
                        m_posts.create(arr_data, (err, result) => {

                            if (result) {
                                return res.redirect(get_admin_url + '/' + post_type_slug + '/update/' + result._id);
                            } else {
                                return res.redirect(page_errors);
                            }
                        });
                    });
                } else {
                    return res.redirect(page_errors);
                }
            });
        }
    },

    update: (req, res, next) => { // done
        // check exist post_type
        if (exist_post_type(req.params.post_type)) {
            var post_type = exist_post_type(req.params.post_type), post_type_slug = post_type.post_type_slug, post_type_id = post_type.post_type_id;
        } else {
            return res.redirect(page_404);
        }
        // end check exist post_type
        if (req.method == 'GET') {
            if (req.params._id && req.params._id != null && req.params._id != '' && typeof req.params._id !== 'undefined') { var _id = req.params._id };
            if (_id) {
                m_posts.findOne({ _id: _id }, (err, result) => {
                    if (result) {
                        result = JSON.parse(JSON.stringify(result));
                        progress_post(result).then((post) => {
                            m_terms.find({}).exec((err, terms) => {
                                terms = JSON.parse(JSON.stringify(terms));
                                return res.render('backend/posts/update', {
                                    terms: terms ? terms : [],
                                    post: post,
                                    site_info: {
                                        page_title: 'Update ' + post_type_slug.substring(0, post_type_slug.length - 1), // bỏ chữ s cuối, ví dụ Add new post(s)
                                        page_slug: 'update_' + post_type_slug,
                                        post_type: post_type,
                                        me: res.locals.me
                                    }
                                });
                            });
                        });
                    } else {
                        return res.redirect(page_404);
                    }
                });
            }
        } else if (req.method == 'PUT') {
            var form = new formidable.IncomingForm(); form.maxFileSize = 20 * 1024 * 1024;
            form.parse(req, (err, fields, files) => {
                if (fields._id && fields._id != null && fields._id != '' && typeof fields._id !== 'undefined') { var _id = fields._id };
                if (fields.title && fields.title != null && fields.title != '' && typeof fields.title !== 'undefined') { var title = fields.title };
                if (_id && title) {
                    var arr_data = new Object(),
                        slug = slugify(fields.title, { replacement: '-', remove: /[$*_+~.()'"!\-:@]/g, lower: true });
                    exist_slug(slug).then((result_slug) => {
                        arr_data.title = fields.title;
                        arr_data.slug = result_slug ? result_slug : slug;
                        if (fields.content && fields.content != null && fields.content != '' && typeof fields.content !== 'undefined') { arr_data.content = fields.content };
                        if (fields.excerpt && fields.excerpt != null && fields.excerpt != '' && typeof fields.excerpt !== 'undefined') { arr_data.excerpt = fields.excerpt };

                        if (files.thumbnail.name) {
                            var name_file = md5(Math.random().toString());
                            var oldpath = files.thumbnail.path;
                            var type_file = (files.thumbnail.name.split('.'))[1];
                            var newpath = path.resolve('assets/backend/uploads/' + name_file + '.' + type_file);
                            fs.rename(oldpath, newpath, (err) => { });
                            arr_data.thumbnail = name_file + '.' + type_file;
                        } else {
                            if (fields.check_del_thumbnail && fields.check_del_thumbnail != null && fields.check_del_thumbnail != '' && typeof fields.check_del_thumbnail !== 'undefined') {
                                arr_data.thumbnail = null;
                            }
                        }
                        if (fields.comments && fields.comments != null && fields.comments != '' && typeof fields.comments !== 'undefined') { arr_data.comments = fields.comments };
                        if (fields.terms && fields.terms != null && fields.terms != '' && typeof fields.terms !== 'undefined') {
                            var arr_terms = (fields.terms).split(','), terms = [];
                            for (var i in arr_terms) {
                                var term = {};
                                term._id = arr_terms[i];
                                terms.push(term)
                            }
                            arr_data.terms = terms;
                        }
                        if (fields.custom_fields && fields.custom_fields != null && fields.custom_fields != '' && typeof fields.custom_fields !== 'undefined') { arr_data.custom_fields = fields.custom_fields };
                        // if (res.locals.me._id) { arr_data.user_id = res.locals.me._id };

                        if (res.locals.me.role == 0) {
                            arr_data.status = '0';
                        } else {
                            if (fields.status && fields.status != null && fields.status != '' && typeof fields.status !== 'undefined') { arr_data.status = fields.status } else { arr_data.status = '0' };
                        }
                        arr_data.updated_at = new Date();
                        if (fields.num_order && fields.num_order != null && fields.num_order != '' && typeof fields.num_order !== 'undefined') { arr_data.num_order = fields.num_order } else { arr_data.num_order = '0' };
                        m_posts.findOneAndUpdate({ _id: _id }, { $set: arr_data }, { new: true }, (err, result) => {
                            if (result) {
                                return res.redirect(get_admin_url + '/' + post_type_slug + '/update/' + result._id);
                            } else {
                                return res.redirect(page_errors);
                            }
                        });
                    });
                } else {
                    return res.redirect(page_errors);
                }
            });
        }
    },
    delete: (req, res, next) => { // done
        // check exist post_type
        if (exist_post_type(req.params.post_type)) {
            var post_type = exist_post_type(req.params.post_type), post_type_slug = post_type.post_type_slug, post_type_id = post_type.post_type_id;
        } else {
            return res.redirect(page_404);
        }
        // end check exist post_type
        if (req.body._id && req.body._id != null && req.body._id != '' && typeof req.body._id !== 'undefined') { var _id = req.body._id };
        if (_id) {
            m_posts.deleteOne({ _id: _id }, (err, result) => {
                if (result) {
                    return res.redirect(get_admin_url + '/' + post_type_slug);
                } else {
                    return res.redirect(page_404);
                }
            });
        } else {
            return res.redirect(page_errors);
        }
    }
}
module.exports = posts_controller;