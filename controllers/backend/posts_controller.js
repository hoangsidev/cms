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
    get_site_name = configs.get_site_name(),
    ObjectID = configs.ObjectID();

app.use(body_parser.json());
app.use(body_parser.urlencoded({ extended: true }));

const exist_post_type = (slug) => {
    var post_type, post_type_id;
    if (slug && slug != null && slug != '' && typeof slug !== 'undefined' && (slug == 'articles' || slug == 'pages')) {
        if (slug == 'articles') { post_type_id = '1'; } else if (slug == 'pages') { post_type_id = '2'; }
        return post_type = {
            post_type_slug: slug,
            post_type_id: post_type_id
        }
    } else {
        return false;
    }
}

// promise
const promise_terms = (arr_terms, taxonomy_id) => {
    return new Promise((resolve, reject) => {
        var terms = [];
        for (var i in arr_terms) {
            m_terms.findOne({ _id: (arr_terms[i])._id, taxonomy_id: taxonomy_id }).sort({ title: 1 }).exec((err, result_term) => {
                if (result_term != null) {
                    var term = {};
                    term._id = result_term._id;
                    term.title = result_term.title;
                    term.slug = result_term.slug;
                    term.taxonomy_id = result_term.taxonomy_id;
                    terms.push(term);
                }
                resolve(terms);
            });
        }
    });
}

const promise_user = (author_id) => {
    return new Promise((resolve, reject) => {
        m_users.findOne({ _id: author_id }, (err, result_user) => {
            var user = {};
            user._id = result_user._id;
            user.username = result_user.username;
            user.display_name = result_user.display_name;
            resolve(user);
        });
    });
}

const promise_post = (elem, post) => {
    return new Promise((resolve, reject) => {
        post._id = elem._id;
        post.title = elem.title;
        post.slug = elem.slug;
        post.content = elem.content;
        post.excerpt = elem.excerpt;
        post.thumbnail = elem.thumbnail;
        post.status = elem.status;
        post.created_at = elem.created_at;
        post.updated_at = elem.updated_at;
        post.num_order = elem.num_order;
        resolve(post);
    });
}

const progress_post = async (result) => {
    var elem = result,
        post = {},
        categories = await promise_terms(elem.terms, '1'),
        tags = await promise_terms(elem.terms, '2'),
        user = await promise_user(elem.author_id),
        post = await promise_post(elem, post);
    post.categories = categories;
    post.tags = tags;
    post.author = user;
    return Promise.resolve(post);
}


const progress_posts = async (results) => {
    var posts = [];
    for (var j in results) {
        var elem = results[j],
            post = {},
            categories = await promise_terms(elem.terms, '1'),
            tags = await promise_terms(elem.terms, '2'),
            user = await promise_user(elem.author_id),
            post = await promise_post(elem, post);
        post.categories = categories;
        post.tags = tags;
        post.author = user;
        posts.push(post);
    }
    return Promise.resolve(posts);
}
// end promise

var posts_controller = {
    // CURD
    posts: (req, res, next) => {  // done
        // check exist post_type
        if (exist_post_type(req.params.post_type)) {
            var post_type = exist_post_type(req.params.post_type), post_type_slug = post_type.post_type_slug, post_type_id = post_type.post_type_id;
        } else {
            return res.redirect(get_admin_url + '/404');
        }
        // end check exist post_type
        if (req.query.search && req.query.search != null && req.query.search != '' && typeof req.query.search !== 'undefined') { var key_search = req.query.search };
        var per_page = 2, // num of post in one page
            page = (req.params.page && req.params.page != null && req.params.page != '' && typeof req.params.page !== 'undefined' && !isNaN(req.params.page)) ? req.params.page : 1;
        if (!key_search) { // list all
            m_posts.find({ post_type_id: post_type_id }).skip((per_page * page) - per_page).limit(per_page).exec((err, results) => {
                results = JSON.parse(JSON.stringify(results));
                progress_posts(results).then((posts) => {
                    m_posts.find({ post_type_id: post_type_id }).count().exec((err, count) => {
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
            var regex = [
                { title: new RegExp(key_search, "i") }, // thêm '^' +  : là search bắt đầu bằng từ khóa
                { slug: new RegExp(key_search, "i") },
                { content: new RegExp(key_search, "i") }
            ];
            m_posts.find({ $and: [{ post_type_id: post_type_id }, { $or: regex }] }).skip((per_page * page) - per_page).limit(per_page).exec((err, results) => {
                results = JSON.parse(JSON.stringify(results));
                progress_posts(results).then((posts) => {
                    m_posts.find({ $and: [{ post_type_id: post_type_id }, { $or: regex }] }).count().exec((err, count) => {
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
            return res.redirect(get_admin_url + '/404');
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
                    var arr_data = new Object();
                    arr_data.title = fields.title;
                    arr_data.slug = slugify(fields.title, { replacement: '-', remove: /[$*_+~.()'"!\-:@]/g, lower: true });
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
                    arr_data.terms = (fields.terms && fields.terms != null && fields.terms != '' && typeof fields.terms !== 'undefined') ? JSON.parse(fields.terms) : [];
                    arr_data.custom_fields = (fields.custom_fields && fields.custom_fields != null && fields.custom_fields != '' && typeof fields.custom_fields !== 'undefined') ? fields.custom_fields : [];
                    arr_data.user = {
                        _id: (res.locals.me._id).toString(),
                        username: res.locals.me.username,
                        email: res.locals.me.email,
                        display_name: res.locals.me.display_name ? res.locals.me.display_name : res.locals.me.username
                    };

                    arr_data.post_type_id = (fields.post_type_id && fields.post_type_id != null && fields.post_type_id != '' && typeof fields.post_type_id !== 'undefined') ? fields.post_type_id : '1';
                    arr_data.status = (fields.status && fields.status != null && fields.status != '' && typeof fields.status !== 'undefined') ? fields.status : '0';
                    arr_data.post_type_id = fields.post_type_id;
                    arr_data.created_at = new Date();
                    arr_data.updated_at = null;
                    arr_data.num_order = (fields.num_order && fields.num_order != null && fields.num_order != '' && typeof fields.num_order !== 'undefined') ? fields.num_order : '0';
                    m_posts.create(arr_data, (err, result) => {

                        if (result) {
                            return res.redirect(get_admin_url + '/' + post_type_slug + '/update/' + result._id);
                        } else {
                            return res.redirect(get_admin_url + '/error');
                        }
                    });
                } else {
                    return res.redirect(get_admin_url + '/error');
                }
            });
        }
    },

    update: (req, res, next) => { // done
        // check exist post_type
        if (exist_post_type(req.params.post_type)) {
            var post_type = exist_post_type(req.params.post_type), post_type_slug = post_type.post_type_slug, post_type_id = post_type.post_type_id;
        } else {
            return res.redirect(get_admin_url + '/404');
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
                                    post: result,
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
                        return res.redirect(get_admin_url + '/404');
                    }
                });
            }
        } else if (req.method == 'PUT') {
            var form = new formidable.IncomingForm(); form.maxFileSize = 20 * 1024 * 1024;
            form.parse(req, (err, fields, files) => {
                if (fields._id && fields._id != null && fields._id != '' && typeof fields._id !== 'undefined') { var _id = fields._id };
                if (fields.title && fields.title != null && fields.title != '' && typeof fields.title !== 'undefined') { var title = fields.title };
                if (_id && title) {
                    var arr_data = new Object();
                    arr_data.title = fields.title;
                    arr_data.slug = slugify(fields.title, { replacement: '-', remove: /[$*_+~.()'"!\-:@]/g, lower: true });
                    if (fields.content && fields.content != null && fields.content != '' && typeof fields.content !== 'undefined') { arr_data.content = fields.content };
                    if (fields.excerpt && fields.excerpt != null && fields.excerpt != '' && typeof fields.excerpt !== 'undefined') { arr_data.excerpt = fields.excerpt };
                    if (files.thumbnail.name) {
                        var name_file = md5(Math.random().toString());
                        var oldpath = files.thumbnail.path;
                        var type_file = (files.thumbnail.name.split('.'))[1];
                        var newpath = path.resolve('assets/backend/uploads/' + name_file + '.' + type_file);
                        fs.rename(oldpath, newpath, (err) => { });
                        arr_data.thumbnail = name_file + '.' + type_file;
                    }
                    if (fields.comments && fields.comments != null && fields.comments != '' && typeof fields.comments !== 'undefined') { arr_data.comments = fields.comments };
                    if (fields.terms && fields.terms != null && fields.terms != '' && typeof fields.terms !== 'undefined') { arr_data.terms = fields.terms };
                    if (fields.custom_fields && fields.custom_fields != null && fields.custom_fields != '' && typeof fields.custom_fields !== 'undefined') { arr_data.custom_fields = fields.custom_fields };
                    if (res.locals.me._id) { arr_data.author_id = res.locals.me._id };
                    if (fields.post_type_id && fields.post_type_id != null && fields.post_type_id != '' && typeof fields.post_type_id !== 'undefined') { arr_data.post_type_id = fields.post_type_id } else { arr_data.post_type_id = '1' };
                    if (fields.status && fields.status != null && fields.status != '' && typeof fields.status !== 'undefined') { arr_data.status = fields.status } else { arr_data.status = '0' };
                    arr_data.updated_at = new Date();
                    if (fields.num_order && fields.num_order != null && fields.num_order != '' && typeof fields.num_order !== 'undefined') { arr_data.num_order = fields.num_order } else { arr_data.num_order = '0' };
                    m_posts.findOneAndUpdate({ _id: _id }, { $set: arr_data }, { new: true }, (err, result) => {
                        if (result) {
                            return res.redirect(get_admin_url + '/posts/update/' + result._id);
                        } else {
                            return res.redirect(get_admin_url + '/error');
                        }
                    });
                } else {
                    return res.redirect(get_admin_url + '/error');
                }
            });
        }
    },
    delete: (req, res, next) => { // done
        // check exist post_type
        if (exist_post_type(req.params.post_type)) {
            var post_type = exist_post_type(req.params.post_type), post_type_slug = post_type.post_type_slug, post_type_id = post_type.post_type_id;
        } else {
            return res.redirect(get_admin_url + '/404');
        }
        // end check exist post_type
        if (req.body._id && req.body._id != null && req.body._id != '' && typeof req.body._id !== 'undefined') { var _id = req.body._id };
        if (_id) {
            m_posts.deleteOne({ _id: _id }, (err, result) => {
                if (result) {
                    return res.redirect(get_admin_url + '/' + post_type_slug);
                } else {
                    return res.redirect(get_admin_url + '/404');
                }
            });
        } else {
            return res.redirect(get_admin_url + '/error');
        }
    }
    // End CURD
}
module.exports = posts_controller;