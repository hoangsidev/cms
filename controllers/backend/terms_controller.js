var configs = require('../../configs/configs.js'),
    m_terms = require('../../models/terms_model.js'),
    m_posts = require('../../models/posts_model.js'),
    app = configs.app(),
    express = configs.express(),
    session = configs.session(),
    md5 = configs.md5(),
    fs = configs.fs(),
    path = configs.path(),
    formidable = configs.formidable(),
    app = configs.app(),
    method_override = configs.method_override(),
    body_parser = configs.body_parser(),
    slugify = configs.slugify(),
    get_site_url = configs.get_site_url(),
    get_admin_url = configs.get_admin_url(),
    get_site_name = configs.get_site_name();
app.use(body_parser.json());
app.use(body_parser.urlencoded({ extended: true }));

var page_404 = get_admin_url + '/404', page_errors = get_admin_url + '/errors';

const exist_taxonomy = (slug) => {
    var taxonomy, taxonomy_id;
    if (slug && slug != null && slug != '' && typeof slug !== 'undefined' && (slug == 'categories' || slug == 'tags')) {
        if (slug == 'categories') { taxonomy_id = '1'; } else if (slug == 'tags') { taxonomy_id = '2'; }
        return taxonomy = {
            taxonomy_slug: slug,
            taxonomy_id: taxonomy_id
        }
    } else { return false; }
}

const exist_slug = (slug, _id) => {
    return new Promise((resolve, reject) => {
        // Nếu là update thì lúc tìm fải loại trừ slug của chính nó
        var regex_slug;
        if (_id) {
            regex_slug = { slug: slug, _id: { $ne: _id } }
        } else {
            regex_slug = { slug: slug }
        }
        m_terms.findOne(regex_slug, (err, exist) => {
            if (exist != null) {
                resolve(exist_slug(slug + '-2'));
            } else if (exist == null) {
                resolve(slug);
            }
        });
    });
}

var terms_controller = {
    // CURD
    terms: (req, res, next) => {  // done
        // check exist_taxonomy
        if (exist_taxonomy(req.params.taxonomy)) {
            var taxonomy = exist_taxonomy(req.params.taxonomy), taxonomy_slug = taxonomy.taxonomy_slug, taxonomy_id = taxonomy.taxonomy_id;
        } else {
            return res.redirect(page_404);
        }
        // end check exist_taxonomy
        if (req.query.search && req.query.search != null && req.query.search != '' && typeof req.query.search !== 'undefined') { var key_search = req.query.search };
        var per_page = 20, // num of term in one page
            page = (req.params.page && req.params.page != null && req.params.page != '' && typeof req.params.page !== 'undefined' && !isNaN(req.params.page)) ? req.params.page : 1;
        if (!key_search) { // list all
            m_terms.find({ taxonomy_id: taxonomy_id }).skip((per_page * page) - per_page).limit(per_page).exec((err, results) => {
                terms = JSON.parse(JSON.stringify(results));
                m_terms.find({ taxonomy_id: taxonomy_id }).count().exec((err, count) => {
                    return res.render('backend/terms/terms', {
                        terms: terms ? terms : [],
                        current: page,
                        pages: Math.ceil(count / per_page),
                        paginate: (count > per_page) ? true : false,
                        site_info: {
                            page_title: 'All term of ' + taxonomy_slug,
                            page_slug: taxonomy_slug,
                            taxonomy: taxonomy,
                            me: res.locals.me
                        }
                    });
                });
            });
        } else { // if search
            var regex = [
                { title: new RegExp(key_search, "i") }, // thêm '^' +  : là search bắt đầu bằng từ khóa
                { slug: new RegExp(key_search, "i") },
                { description: new RegExp(key_search, "i") }
            ];
            m_terms.find({ $and: [{ taxonomy_id: taxonomy_id }, { $or: regex }] }).skip((per_page * page) - per_page).limit(per_page).exec((err, results) => {
                terms = JSON.parse(JSON.stringify(results));
                m_terms.find({ $and: [{ taxonomy_id: taxonomy_id }, { $or: regex }] }).count().exec((err, count) => {
                    return res.render('backend/terms/terms', {
                        terms: terms ? terms : [],
                        current: page,
                        pages: Math.ceil(count / per_page),
                        key_search: key_search,
                        count_result: count,
                        paginate: count > per_page ? true : false,
                        site_info: {
                            page_title: 'Search results ' + taxonomy_slug,
                            page_slug: taxonomy_slug,
                            taxonomy: taxonomy,
                            me: res.locals.me
                        }
                    });
                });
            });
        }

    },
    create: (req, res, next) => { // done
        // check exist_taxonomy
        if (exist_taxonomy(req.params.taxonomy)) {
            var taxonomy = exist_taxonomy(req.params.taxonomy), taxonomy_slug = taxonomy.taxonomy_slug, taxonomy_id = taxonomy.taxonomy_id;
        } else {
            return res.redirect(page_404);
        }
        // end check exist_taxonomy
        if (req.method == 'POST') {


            var form = new formidable.IncomingForm(); form.maxFileSize = 20 * 1024 * 1024; // 20MB
            form.parse(req, (err, fields, files) => {
                if (fields.title && fields.title != null && fields.title != '' && typeof fields.title !== 'undefined') { var title = fields.title };
                if (fields.taxonomy_id && fields.taxonomy_id != null && fields.taxonomy_id != '' && typeof fields.taxonomy_id !== 'undefined') { var taxonomy_id = fields.taxonomy_id };
                if (title && taxonomy_id) {
                    var arr_data = new Object(),
                        slug = slugify(fields.title, { replacement: '-', remove: /[$*_+~.()'"!\-:@]/g, lower: true });
                    exist_slug(slug).then((result_slug) => {
                        arr_data.title = fields.title;
                        arr_data.slug = result_slug ? result_slug : slug;
                        arr_data.description = (fields.description && fields.description != null && fields.description != '' && typeof fields.description !== 'undefined') ? fields.description : null;
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
                        arr_data.taxonomy_id = fields.taxonomy_id;
                        arr_data.num_order = (fields.num_order && fields.num_order != null && fields.num_order != '' && typeof fields.num_order !== 'undefined') ? fields.num_order : '0';
                        m_terms.create(arr_data, (err, result) => {
                            if (result) {
                                return res.redirect(get_admin_url + '/terms/' + taxonomy_slug);
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
        // check exist_taxonomy
        if (exist_taxonomy(req.params.taxonomy)) {
            var taxonomy = exist_taxonomy(req.params.taxonomy), taxonomy_slug = taxonomy.taxonomy_slug, taxonomy_id = taxonomy.taxonomy_id;
        } else {
            return res.redirect(page_404);
        }
        // end check exist_taxonomy
        if (req.method == 'GET') {
            if (req.params._id && req.params._id != null && req.params._id != '' && typeof req.params._id !== 'undefined') { var _id = req.params._id };
            if (_id) {
                m_terms.findOne({ _id: _id }, (err, result) => {
                    if (result) {
                        term = JSON.parse(JSON.stringify(result));
                        return res.render('backend/terms/update', {
                            term: term,
                            site_info: {
                                page_title: 'Update ' + taxonomy_slug,
                                page_slug: 'update_' + taxonomy_slug,
                                taxonomy: taxonomy,
                                me: res.locals.me
                            }
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
                if (fields.taxonomy_id && fields.taxonomy_id != null && fields.taxonomy_id != '' && typeof fields.taxonomy_id !== 'undefined') { var taxonomy_id = fields.taxonomy_id };
                if (_id && title && taxonomy_id) {
                    var arr_data = new Object(),
                        slug = slugify(fields.title, { replacement: '-', remove: /[$*_+~.()'"!\-:@]/g, lower: true });
                    exist_slug(slug, _id).then((result_slug) => {
                        arr_data.title = fields.title;
                        arr_data.slug = result_slug ? result_slug : slug;
                        if (fields.description && fields.description != null && fields.description != '' && typeof fields.description !== 'undefined') { arr_data.description = fields.description };
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
                        if (fields.num_order && fields.num_order != null && fields.num_order != '' && typeof fields.num_order !== 'undefined') { arr_data.num_order = fields.num_order } else { arr_data.num_order = '0' };
                        m_terms.findOneAndUpdate({ _id: _id }, { $set: arr_data }, { new: true }, (err, result) => {
                            if (result) {
                                return res.redirect(get_admin_url + '/terms/' + taxonomy_slug + '/update/' + result._id);
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
        // check exist_taxonomy
        if (exist_taxonomy(req.params.taxonomy)) {
            var taxonomy = exist_taxonomy(req.params.taxonomy), taxonomy_slug = taxonomy.taxonomy_slug, taxonomy_id = taxonomy.taxonomy_id;
        } else {
            return res.redirect(page_404);
        }
        // end check exist_taxonomy
        if (req.body._id && req.body._id != null && req.body._id != '' && typeof req.body._id !== 'undefined') { var _id = req.body._id };
        if (_id) {
            m_terms.deleteOne({ _id: _id }, (err, result) => {
                if (result) {
                    m_posts.find({ 'terms._id': _id }, (err, results) => { // tìm tất cả bài post có term_id đó
                        results = JSON.parse(JSON.stringify(results));
                        var arr_terms_new = [];
                        for (i in results) {
                            post_id = results[i]._id;
                            terms = results[i].terms; // lấy tất cả term_id của bài post đó, for ra, push zô lại nhưng loại trừ term_id xóa

                            for (j in terms) {
                                if (terms[j]._id !== _id) {
                                    var obj_term = {};
                                    obj_term._id = terms[j]._id;
                                    arr_terms_new.push(obj_term)
                                }
                            }

                            m_posts.findOneAndUpdate({ _id: post_id }, { $set: { terms: arr_terms_new } }, { new: true }, (err, result) => {
                               console.log('Deleted relationship term in post!');
                            });

                        }
                    });
                    return res.redirect(get_admin_url + '/terms/' + taxonomy_slug);
                } else {
                    return res.redirect(page_404);
                }
            });
        } else {
            return res.redirect(page_errors);
        }
    }
    // End CURD
}
module.exports = terms_controller;