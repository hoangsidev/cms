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



// promise backend
const promise_terms_of_post = (arr_terms, taxonomy_id) => {
    return new Promise((resolve, reject) => {
        var terms = [];
        if (arr_terms.length > 0) {
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
        } else {
            resolve(terms);
        }
    });
}

const promise_user_of_post = (user_id) => {
    return new Promise((resolve, reject) => {
        if (user_id) {
            m_users.findOne({ _id: user_id }, (err, result_user) => {
                if (result_user) {
                    var user = {};
                    user._id = result_user._id;
                    user.username = result_user.username;
                    user.display_name = result_user.display_name;
                    resolve(user);
                } else {
                    resolve(null);
                }
            });
        } else {
            resolve(null);
        }
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

// end promise backend

// promise frontend


const promise_get_articles = () => {
    return new Promise((resolve, reject) => {
        m_posts.find({ post_type_id: '1' }).exec((err, articles) => {
            resolve(articles);
        });
    });
}

const promise_get_pages = () => {
    return new Promise((resolve, reject) => {
        m_posts.find({ post_type_id: '2' }).exec((err, pages) => {
            resolve(pages);
        });
    });
}

const promise_get_terms = () => {
    return new Promise((resolve, reject) => {
        m_posts.find({ post_type_id: '2' }).exec((err, pages) => {
            resolve(pages);
        });
    });
}


const promise_terms = (taxonomy_id) => {
    return new Promise((resolve, reject) => {
        m_terms.find({ taxonomy_id: taxonomy_id }).exec((err, terms) => {
            resolve(terms);
        });
    });
}

// end promise frontend


// async backend
const progress_post = async (result) => {
    var elem = result,
        post = {},
        categories = await promise_terms_of_post(elem.terms, '1'),
        tags = await promise_terms_of_post(elem.terms, '2'),
        user = await promise_user_of_post(elem.user_id),
        post = await promise_post(elem, post);
    post.categories = categories ? categories : [];
    post.tags = tags ? tags : [];
    post.user = user ? user : null;
    return Promise.resolve(post);
}

const progress_posts = async (results) => {
    var posts = [];
    for (var j in results) {
        var elem = results[j],
            post = {},
            categories = await promise_terms_of_post(elem.terms, '1'),
            tags = await promise_terms_of_post(elem.terms, '2'),
            user = await promise_user_of_post(elem.user_id),
            post = await promise_post(elem, post);
        post.categories = categories ? categories : [];
        post.tags = tags ? tags : [];
        post.user = user ? user : null;
        posts.push(post);
    }
    return Promise.resolve(posts);
}

// end async backend

// async frontend
const app_globals = async () => {
    var app_globals = {},
        articles = await promise_get_articles(),
        pages = await promise_get_pages('2'),
        categories = await promise_terms('1'),
        tags = await promise_terms('2');

    app_globals.articles = articles ? JSON.parse(JSON.stringify(articles)) : [];
    app_globals.categories = categories ? JSON.parse(JSON.stringify(categories)) : [];
    app_globals.tags = tags ? JSON.parse(JSON.stringify(tags)) : [];
    app_globals.pages = pages ? JSON.parse(JSON.stringify(pages)) : [];
    app_globals.navs = 'menu';
    return Promise.resolve(app_globals);
}

// end async frontend

module.exports = {
    promise_terms_of_post,
    promise_user_of_post,
    promise_post,
    progress_post,
    progress_posts,

    app_globals
}
