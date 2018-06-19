var configs = require('../../configs/configs.js'),
    m_terms = require('../../models/terms_model.js'),
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

function exist_taxonomy(slug) {
    var taxonomy, taxonomy_id;
    if (slug && slug != null && slug != '' && typeof slug !== 'undefined' && (slug == 'categories' || slug == 'tags')) {
        if (slug == 'categories') { taxonomy_id = '1'; } else if (slug == 'tags') { taxonomy_id = '2'; }
        return taxonomy = {
            taxonomy_slug: slug,
            taxonomy_id: taxonomy_id
        }
    } else {
        return false;
    }
}

var terms_controller = {
    // CURD
    terms: (req, res, next) => {  // done
        // check exist_taxonomy
        if (exist_taxonomy(req.params.taxonomy)) {
            var taxonomy = exist_taxonomy(req.params.taxonomy), taxonomy_slug = taxonomy.taxonomy_slug, taxonomy_id = taxonomy.taxonomy_id;
        } else {
            return res.redirect(get_admin_url + '/404');
        }
        // end check exist_taxonomy
        if (req.query.search && req.query.search != null && req.query.search != '' && typeof req.query.search !== 'undefined') { var key_search = req.query.search };
        var per_page = 20, // num of term in one page
            page = (req.params.page && req.params.page != null && req.params.page != '' && typeof req.params.page !== 'undefined' && !isNaN(req.params.page)) ? req.params.page : 1;
        if (!key_search) { // list all
            m_terms.find({ taxonomy_id: taxonomy_id }).skip((per_page * page) - per_page).limit(per_page).exec((err, result) => {
                m_terms.find({ taxonomy_id: taxonomy_id }).count().exec((err, count) => {
                    return res.render('backend/terms/terms', {
                        data_terms: JSON.stringify(result) ? JSON.stringify(result) : JSON.stringify([]),
                        current: page,
                        pages: Math.ceil(count / per_page),
                        paginate: (count > per_page) ? true : false,
                        site_info: {
                            page_title: 'All term of ' + taxonomy_slug,
                            page_slug: taxonomy_slug,
                            taxonomy : taxonomy,
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
            m_terms.find({ $and: [{ taxonomy_id: taxonomy_id }, { $or: regex }] }).skip((per_page * page) - per_page).limit(per_page).exec((err, result) => {
                m_terms.find({ $and: [{ taxonomy_id: taxonomy_id }, { $or: regex }] }).count().exec((err, count) => {
                    return res.render('backend/terms/terms', {
                        data_terms: JSON.stringify(result) ? JSON.stringify(result) : JSON.stringify([]),
                        current: page,
                        pages: Math.ceil(count / per_page),
                        key_search: key_search,
                        count_result: count,
                        paginate: count > per_page ? true : false,
                        site_info: {
                            page_title: 'Search results ' + taxonomy_slug,
                            page_slug: taxonomy_slug,
                            taxonomy : taxonomy,
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
            return res.redirect(get_admin_url + '/404');
        }
        // end check exist_taxonomy
        if (req.method == 'POST') {
            var form = new formidable.IncomingForm(); form.maxFileSize = 20 * 1024 * 1024; // 20MB
            form.parse(req, (err, fields, files) => {
                if (fields.title && fields.title != null && fields.title != '' && typeof fields.title !== 'undefined') { var title = fields.title };
                if (fields.taxonomy_id && fields.taxonomy_id != null && fields.taxonomy_id != '' && typeof fields.taxonomy_id !== 'undefined') { var taxonomy_id = fields.taxonomy_id };
                if (title && taxonomy_id) {
                    var arr_data = new Object();
                    arr_data.title = fields.title;
                    arr_data.slug = slugify(fields.title, { replacement: '-', remove: /[$*_+~.()'"!\-:@]/g, lower: true });
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
                            return res.redirect(get_admin_url + '/errors');
                        }
                    });
                } else {
                    return res.redirect(get_admin_url + '/errors');
                }
            });
        }
    },

    update: (req, res, next) => { // done
         // check exist_taxonomy
         if (exist_taxonomy(req.params.taxonomy)) {
            var taxonomy = exist_taxonomy(req.params.taxonomy), taxonomy_slug = taxonomy.taxonomy_slug, taxonomy_id = taxonomy.taxonomy_id;
        } else {
            return res.redirect(get_admin_url + '/404');
        }
        // end check exist_taxonomy
        if (req.method == 'GET') {
            if (req.params._id && req.params._id != null && req.params._id != '' && typeof req.params._id !== 'undefined') { var _id = req.params._id };
            if (_id) {
                m_terms.findOne({ _id: _id }, (err, result) => {
                    if (result) {
                        return res.render('backend/terms/update', {
                            data_term: JSON.stringify(result),
                            site_info: {
                                page_title: 'Update ' + taxonomy_slug,
                                page_slug: 'update_' + taxonomy_slug,
                                taxonomy : taxonomy,
                                me: res.locals.me
                            }
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
                if (fields.taxonomy_id && fields.taxonomy_id != null && fields.taxonomy_id != '' && typeof fields.taxonomy_id !== 'undefined') { var taxonomy_id = fields.taxonomy_id };
                if (_id && title && taxonomy_id) {
                    var arr_data = new Object();
                    arr_data.title = fields.title;
                    arr_data.slug = slugify(fields.title, { replacement: '-', remove: /[$*_+~.()'"!\-:@]/g, lower: true });
                    if (fields.description && fields.description != null && fields.description != '' && typeof fields.description !== 'undefined') { arr_data.description = fields.description };
                    if (files.thumbnail.name) {
                        var name_file = md5(Math.random().toString());
                        var oldpath = files.thumbnail.path;
                        var type_file = (files.thumbnail.name.split('.'))[1];
                        var newpath = path.resolve('assets/backend/uploads/' + name_file + '.' + type_file);
                        fs.rename(oldpath, newpath, (err) => { });
                        arr_data.thumbnail = name_file + '.' + type_file;
                    }
                    if (fields.num_order && fields.num_order != null && fields.num_order != '' && typeof fields.num_order !== 'undefined') { arr_data.num_order = fields.num_order } else { arr_data.num_order = '0' };
                    m_terms.findOneAndUpdate({ _id: _id }, { $set: arr_data }, { new: true }, (err, result) => {
                        if (result) {
                            return res.redirect(get_admin_url + '/terms/'+ taxonomy_slug +'/update/' + result._id);
                        } else {
                            return res.redirect(get_admin_url + '/errors');
                        }
                    });
                } else {
                    return res.redirect(get_admin_url + '/errors');
                }
            });
        }
    },
    delete: (req, res, next) => { // done
        // check exist_taxonomy
        if (exist_taxonomy(req.params.taxonomy)) {
            var taxonomy = exist_taxonomy(req.params.taxonomy), taxonomy_slug = taxonomy.taxonomy_slug, taxonomy_id = taxonomy.taxonomy_id;
        } else {
            return res.redirect(get_admin_url + '/404');
        }
        // end check exist_taxonomy
        if (req.body._id && req.body._id != null && req.body._id != '' && typeof req.body._id !== 'undefined') { var _id = req.body._id };
        if (_id) {
            m_terms.deleteOne({ _id: _id }, (err, result) => {
                if (result) {
                    return res.redirect(get_admin_url + '/terms/' + taxonomy_slug);
                } else {
                    return res.redirect(get_admin_url + '/404');
                }
            });
        } else {
            return res.redirect(get_admin_url + '/errors');
        }
    }
    // End CURD
}
module.exports = terms_controller;