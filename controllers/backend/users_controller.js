var configs = require('../../configs/configs.js'),
    m_users = require('../../models/users_model.js'),
    md5 = configs.md5(),
    fs = configs.fs(),
    path = configs.path(),
    formidable = configs.formidable(),
    app = configs.app(),
    body_parser = configs.body_parser(),
    get_site_url = configs.get_site_url(),
    get_admin_url = configs.get_admin_url(),
    get_site_name = configs.get_site_name(),
    nodemailer = configs.nodemailer(),
    get_admin_email = configs.get_admin_email(),
    mail_auth = nodemailer.createTransport({ service: 'gmail', auth: { user: 'authentication.smtp.mail@gmail.com', pass: 'u+J%E^9!hx?p' } });

app.use(body_parser.json());
app.use(body_parser.urlencoded({ extended: true }));

var page_404 = get_admin_url + '/404', page_errors = get_admin_url + '/errors';

const valid_username = (username) => {
    if (username) {
        var re = /^[a-zA-Z0-9]+$/;
        return re.test(username);
    } else {
        return false;
    }
}
const valid_email = (email) => {
    if (email) {
        var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return re.test(email);
    } else {
        return false;
    }
}
const valid_password = (password) => {
    if (password) {
        var re = /(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,}/;
        return re.test(password);
    } else {
        return false;
    }
}

const check_exist_user = () => { // check exist username & email with socket.io
    io.on('connection', (socket) => {
        socket.on('guest_username', (username) => {
            if (username && username != null && username != '' && typeof username !== 'undefined' && valid_username(username)) {
                m_users.findOne({ username: username }).exec((err, result) => {
                    if (result) { socket.emit('ser_exist_username'); }
                })
            }
        });
        socket.on('guest_email', (email) => {
            if (email && email != null && email != '' && typeof email !== 'undefined' && valid_email(email)) {
                m_users.findOne({ email: email }).exec((err, result) => {
                    if (result) { socket.emit('ser_exist_email'); }
                })
            }
        });
        socket.setMaxListeners(0);
    });
}

var post_type = {
    post_type_slug: 'users',
    post_type_id: '3'
}

var users_controller = {
    signin: (req, res, next) => { // done
        if (req.method == 'GET') {
            if (req.session.me) {
                return res.redirect(get_admin_url + '/dashboard');
            } else {
                return res.render('backend/users/signin', {
                    site_info: {
                        page_title: 'Sign in',
                        page_slug: 'signin'
                    }
                });
            }
        } else if (req.method == 'POST') {
            if (req.body.username && req.body.username != null && req.body.username != '' && typeof req.body.username !== 'undefined') { var username = req.body.username };
            if (req.body.password && req.body.password != null && req.body.password != '' && typeof req.body.password !== 'undefined') { var password = req.body.password };
            if (username && password) {
                m_users.findOne({
                    $or: [{ username: username }, { email: username }], password: md5(password)
                }).exec((err, result) => {
                    if (result) {
                        req.session.me = result;
                        return res.redirect(get_admin_url + '/dashboard');
                    } else {
                        return res.render('backend/users/signin', {
                            site_info: {
                                page_title: 'Sign in',
                                page_slug: 'signin'
                            },
                            incorrect: true
                        });
                    }
                });
            } else { // if nó phá bậy bạ
                return res.redirect('/signin');
            }
        }
    },
    signup: (req, res, next) => { // done
        check_exist_user();
        if (req.method == 'GET') {// if GET
            if (req.session.me) {
                return res.redirect(get_admin_url + '/dashboard');
            } else {
                return res.render('backend/users/signup', {
                    site_info: {
                        page_title: 'Sign up',
                        page_slug: 'signup'
                    }
                });
            }
        } else if (req.method == 'POST') {
            if (req.body.username && req.body.username != null && req.body.username != '' && typeof req.body.username !== 'undefined' && valid_username(req.body.username)) { var username = req.body.username };
            if (req.body.email && req.body.email != null && req.body.email != '' && typeof req.body.email !== 'undefined' && valid_email(req.body.email)) { var email = req.body.email };
            if (req.body.password && req.body.password != null && req.body.password != '' && typeof req.body.password !== 'undefined' && valid_password(req.body.password)) { var password = req.body.password };
            if (username && email && password) {
                var arr_data = new Object();
                arr_data.username = username;
                arr_data.email = email;
                arr_data.display_name = null;
                arr_data.password = md5(password);
                arr_data.thumbnail = null;
                arr_data.key = md5(Math.random().toString());
                arr_data.verify = '0';
                arr_data.role = '0';
                arr_data.created_at = new Date();
                arr_data.updated_at = null;
                m_users.create(arr_data, (err, result) => {
                    if (result) {
                        req.session.me = result;
                        // verify email
                        var url_verify = get_site_url + '/verify/' + result.username + '/' + result.key,
                            mail_options = {
                                from: get_admin_email, to: email, subject: '[' + get_site_name + '] Please verify your email address.',
                                html: `Help us secure your account by verifying your email address (` + result.email + `). This lets you access all of our features.<br><br>
                                <a href="` + url_verify + `">` + url_verify + `</a><br><br>
                                You’re receiving this email because you recently created a new `+ get_site_name + ` account or added a new email address. If this wasn’t you, please ignore this email.`
                            };
                        mail_auth.sendMail(mail_options, (err, sent) => {
                            if (!err) { console.log('Sent verify!'); }
                        });
                        // end verify email
                        return res.redirect(get_admin_url + '/dashboard');
                    }
                });
            } else { // if nó phá bậy bạ
                return res.redirect(page_errors);
            }
        }
    },
    verify: (req, res, next) => { // done
        if (req.params.username && req.params.username != null && req.params.username != '' && typeof req.params.username !== 'undefined' && valid_username(req.params.username)) { var username = req.params.username };
        if (req.params.key && req.params.key != null && req.params.key != '' && typeof req.params.key !== 'undefined') { var key = req.params.key };
        if (username && key) {
            m_users.findOneAndUpdate({ username: username, key: key }, { $set: { verify: 1 } }, { new: true }, (err, result) => {
                if (result) {
                    if (req.session.me) {
                        return res.redirect(get_admin_url + '/users/profile');
                    } else {
                        return res.render('backend/users/verify', {
                            verified: true,
                            username: result.username,
                            email: result.email,
                            site_info: {
                                page_title: 'Verify Email',
                                page_slug: 'verify'
                            }
                        });
                    }
                } else { // nếu url sai
                    return res.redirect(get_site_url + '/signin');
                }
            })
        } else {
            return res.redirect(page_errors);
        }
    },
    signout: (req, res, next) => { // done
        req.session = null;
        if (req.session == null) {
            return res.redirect(get_site_url + '/signin');
        } else {
            return res.redirect(page_errors);
        }
    },
    password_reset: (req, res, next) => { // done
        if (req.method == 'GET') { // if GET
            if (req.params.key && req.params.key != null && req.params.key != '' && typeof req.params.key !== 'undefined') { var key = req.params.key };
            if (key) {
                m_users.findOne({ key: key }, (err, result) => { // nếu key đúng mới hiện form đổi mật khẩu
                    if (result) {
                        return res.render('backend/users/change_password_reset', {
                            key: key,
                            site_info: {
                                page_title: 'Password Reset',
                                page_slug: 'password_reset'
                            }
                        });
                    } else { // key ko hợp lệ
                        return res.render('backend/users/password_reset', {
                            not_match_key: true,
                            site_info: {
                                page_title: 'Password Reset',
                                page_slug: 'password_reset'
                            }
                        });
                    }
                });
            } else { // if ko có key thì trả ra giao diện
                return res.render('backend/users/password_reset', {
                    site_info: {
                        page_title: 'Password Reset',
                        page_slug: 'password_reset'
                    }
                });
            }
        } else if (req.method == 'POST') {
            if (req.body.email && req.body.email != null && req.body.email != '' && typeof req.body.email !== 'undefined' && valid_email(req.body.email)) { var email = req.body.email };
            if (email) {
                m_users.findOne({ email: email }, (err, result) => {
                    if (!result) { // email not exist
                        return res.render('backend/users/password_reset', {
                            not_match_email: true,
                            site_info: {
                                page_title: 'Password Reset',
                                page_slug: 'password_reset'
                            }
                        });
                    } else {
                        if (result.verify == '0') { // if email not verified, can not reset pass
                            return res.render('backend/users/password_reset', {
                                unverify: true,
                                site_info: {
                                    page_title: 'Password Reset',
                                    page_slug: 'password_reset'
                                }
                            });
                        } else { // if exist email, set a new key, then send a email to user
                            m_users.findOneAndUpdate({ email: email }, { $set: { key: md5(Math.random().toString()) } }, { new: true }, (err, result) => {
                                var url_password_reset = get_site_url + '/password_reset?key=' + result.key,
                                    mail_options = {
                                        from: get_admin_email, to: email, subject: '[' + get_site_name + '] Please reset your password',
                                        html: `We heard that you lost your password. Sorry about that! <br> But don’t worry! You can use the following link to reset your password:<br><br>
                                <a href="` + url_password_reset + `">` + url_password_reset + `</a><br><br>Thanks!`
                                    };
                                mail_auth.sendMail(mail_options, (err, sent) => {
                                    if (!err) {
                                        return res.render('backend/users/password_reset', {
                                            sent_email: true,
                                            site_info: {
                                                page_title: 'Password Reset',
                                                page_slug: 'password_reset'
                                            }
                                        });
                                    }
                                });
                            });
                        }
                    }
                });
            } else { // if nó phá bậy bạ
                return res.redirect(page_errors);
            }
        } else if (req.method == 'PUT') { // if PUT
            if (req.body.password && req.body.password != null && req.body.password != '' && typeof req.body.password !== 'undefined' && valid_password(req.body.password)) { var password = req.body.password };
            if (req.body.key && req.body.key != null && req.body.key != '' && typeof req.body.key !== 'undefined') { var key = req.body.key };
            if (password && key) {
                m_users.findOneAndUpdate({ key: key }, { $set: { password: md5(password) } }, { new: true }, (err, result) => {
                    if (result) { // after change password, change key to access denied to old links
                        m_users.findOneAndUpdate({ key: key }, { $set: { key: md5(Math.random().toString()) } }, { new: true }, (err, result) => {
                            if (result) {
                                return res.redirect(get_site_url + '/signin')
                            } else {
                                return res.redirect(get_site_url + '/password_reset');
                            }
                        });
                    } else { // đây là trường hợp đúng key, vào trang đổi pass, nhưng nó kiểm tra phần từ và đổi key
                        console.log('Key đã bị sửa, không khớp');
                        return res.redirect(get_site_url + '/password_reset');
                    }
                });
            } else { // đây là trường hợp nó phá
                return res.redirect(page_errors);
            }
        }
    },

    // CURD
    users: (req, res, next) => { // done
        if (req.query.search && req.query.search != null && req.query.search != '' && typeof req.query.search !== 'undefined') { var key_search = req.query.search };
        var per_page = 20, // num of post in one page
            page = (req.params.page && req.params.page != null && req.params.page != '' && typeof req.params.page !== 'undefined' && !isNaN(req.params.page)) ? req.params.page : 1;
        if (!key_search) {  // list all
            m_users.find({}).skip((per_page * page) - per_page).limit(per_page).exec((err, results) => {
                results = JSON.parse(JSON.stringify(results));
                m_users.count().exec(function (err, count) {
                    return res.render('backend/users/users', {
                        users: results ? results : [],
                        current: page,
                        pages: Math.ceil(count / per_page),
                        paginate: (count > per_page) ? true : false,
                        site_info: {
                            page_title: 'All users',
                            page_slug: 'users',
                            post_type: post_type,
                            me: res.locals.me
                        }
                    });
                });
            });
        } else { // if search     
            var regex = [
                { username: new RegExp(key_search, "i") },
                { email: new RegExp(key_search, "i") },
                { display_name: new RegExp(key_search, "i") }
            ];
            m_users.find({ $or: regex }).skip((per_page * page) - per_page).limit(per_page).exec((err, results) => {
                users = JSON.parse(JSON.stringify(results));
                m_users.find({ $or: regex }).count().exec((err, count) => {
                    return res.render('backend/users/users', {
                        users: users ? users : [],
                        current: page,
                        pages: Math.ceil(count / per_page),
                        key_search: key_search,
                        count_result: count,
                        paginate: count > per_page ? true : false,
                        site_info: {
                            page_title: 'Search result users',
                            page_slug: 'users',
                            post_type: post_type,
                            me: res.locals.me
                        }
                    });
                });
            });
        }
    },
    create: (req, res, next) => {
        check_exist_user();
        if (req.method == 'GET') {
            return res.render('backend/users/create', {
                site_info: {
                    page_title: 'Add new user',
                    page_slug: 'create_user',
                    post_type: post_type,
                    me: res.locals.me
                }
            });
        } else if (req.method == 'POST') {
            var form = new formidable.IncomingForm(); form.maxFileSize = 20 * 1024 * 1024;
            form.parse(req, (err, fields, files) => {
                if (fields.username && fields.username != null && fields.username != '' && typeof fields.username !== 'undefined' && valid_username(fields.username)) { var username = fields.username };
                if (fields.email && fields.email != null && fields.email != '' && typeof fields.email !== 'undefined' && valid_email(fields.email)) { var email = fields.email };
                if (fields.password && fields.password != null && fields.password != '' && typeof fields.password !== 'undefined' && valid_password(fields.password)) { var password = md5(fields.password) };
                if (username && email && password) {
                    var arr_data = new Object();
                    arr_data.username = username;
                    arr_data.email = email;
                    arr_data.display_name = (fields.display_name && fields.display_name != null && fields.display_name != '' && typeof fields.display_name !== 'undefined') ? fields.display_name : null;
                    arr_data.password = password;
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
                    arr_data.key = md5(Math.random().toString());
                    arr_data.verify = '0';
                    arr_data.role = (fields.role && fields.role != null && fields.role != '' && typeof fields.role !== 'undefined') ? fields.role : null;
                    arr_data.created_at = new Date();
                    arr_data.updated_at = null;
                    m_users.create(arr_data, (err, result) => {
                        if (result) {
                            // verify email
                            var url_verify = get_site_url + '/verify/' + result.username + '/' + result.key,
                                mail_options = {
                                    from: get_admin_email, to: email, subject: '[' + get_site_name + '] Please verify your email address.',
                                    html: `Help us secure your account by verifying your email address (` + result.email + `). This lets you access all of our features.<br><br>
                                    <a href="` + url_verify + `">` + url_verify + `</a><br><br>
                                    You’re receiving this email because you recently created a new `+ get_site_name + ` account or added a new email address. If this wasn’t you, please ignore this email.`
                                };
                            mail_auth.sendMail(mail_options, (err, sent) => {
                                if (!err) { console.log('Sent verify!'); }
                            });
                            // end verify email
                            return res.redirect(page_errors);
                        }
                    });
                } else {
                    return res.redirect(page_errors);
                }
            });
        }
    },

    profile: (req, res, next) => {
        check_exist_user();
        if (req.method == 'GET') {
            if (res.locals.me._id && res.locals.me._id != null && res.locals.me._id != '' && typeof res.locals.me._id !== 'undefined') { var _id = res.locals.me._id };
            if (_id) {
                m_users.findOne({ _id: _id }, (err, result) => {
                    if (result) {
                        user = JSON.parse(JSON.stringify(result));
                        return res.render('backend/users/update', {
                            user: user,
                            site_info: {
                                page_title: 'Profile',
                                page_slug: 'profile',
                                post_type: post_type,
                                me: res.locals.me
                            }
                        });
                    } else {
                        return res.redirect(page_404);
                    }
                });
            }
        }
    },

    update: (req, res, next) => {
        check_exist_user();
        if (req.method == 'GET') {
            if (req.params._id && req.params._id != null && req.params._id != '' && typeof req.params._id !== 'undefined') { var _id = req.params._id };
            if (_id) {
                m_users.findOne({ _id: _id }, (err, result) => {
                    if (result) {
                        user = JSON.parse(JSON.stringify(result));
                        return res.render('backend/users/update', {
                            user: user,
                            site_info: {
                                page_title: 'Update user',
                                page_slug: 'update_user',
                                post_type: post_type,
                                me: res.locals.me
                            }
                        });
                    } else {
                        return res.redirect(page_404);
                    }

                });
            } else {
                return res.redirect(page_404);
            }
        } else if (req.method == 'PUT') {
            var form = new formidable.IncomingForm(); form.maxFileSize = 20 * 1024 * 1024;
            form.parse(req, (err, fields, files) => {
                if (fields._id && fields._id != null && fields._id != '' && typeof fields._id !== 'undefined') { var _id = fields._id };
                if (fields.old_email && fields.old_email != null && fields.old_email != '' && typeof fields.old_email !== 'undefined' && valid_email(fields.old_email)) { var old_email = fields.old_email; };

                if (res.locals.me.role != 2) { // nếu không phải admin thì ko được sửa người khác
                    if (res.locals.me._id == _id) {
                        var exactly_user = 1;
                    } else {
                        var exactly_user = 0;
                    }
                } else {
                    var exactly_user = 1;
                }

                if (_id && old_email && exactly_user == 1) {
                    var arr_data = new Object();
                    if (fields.email && fields.email != null && fields.email != '' && typeof fields.email !== 'undefined' && valid_email(fields.email)) {
                        if (fields.email != old_email) { // nếu mail đã bị thay đổi thì đổi thì  xử lý đổi trong dữ liệu, sau đó verify về 0 và gửi mail verify
                            arr_data.email = fields.email;
                            arr_data.verify = '0';
                        }
                    };
                    if (fields.password && fields.password != null && fields.password != '' && typeof fields.password !== 'undefined' && valid_password(fields.password)) {
                        arr_data.password = md5(fields.password);
                        arr_data.key = md5(Math.random().toString());
                    };
                    if (fields.display_name && fields.display_name != null && fields.display_name != '' && typeof fields.display_name !== 'undefined') { arr_data.display_name = fields.display_name };
                    if (files.thumbnail.name) {
                        var name_file = md5(Math.random().toString()),
                            oldpath = files.thumbnail.path,
                            type_file = (files.thumbnail.name.split('.'))[1],
                            newpath = path.resolve('assets/backend/uploads/' + name_file + '.' + type_file);
                        fs.rename(oldpath, newpath, (err) => { });
                        arr_data.thumbnail = name_file + '.' + type_file;
                    };
                    if (res.locals.me.role == 2) {
                        if (fields.role && fields.role != null && fields.role != '' && typeof fields.role !== 'undefined') { arr_data.role = fields.role };
                    }

                    arr_data.updated_at = new Date();
                    m_users.findOneAndUpdate({ _id: _id }, { $set: arr_data }, { new: true }, (err, result) => {
                        if (result) {
                            if (_id == res.locals.me._id) { // nếu tài khoản bị sửa chính là tài khoản đang đăng nhập thì fải làm mới session
                                req.session.me = result;
                            }
                            if (result.verify == 0) { // nếu sau quá trình cập nhật, verify bị đổi về 0 thì gửi 1 mail verify
                                // verify email
                                var url_verify = get_site_url + '/verify/' + result.username + '/' + result.key,
                                    mail_options = {
                                        from: get_admin_email, to: result.email, subject: '[' + get_site_name + '] Please verify your email address.',
                                        html: `Help us secure your account by verifying your email address (` + result.email + `). This lets you access all of our features.<br><br>
                                        <a href="` + url_verify + `">` + url_verify + `</a><br><br>
                                        You’re receiving this email because you recently created a new `+ get_site_name + ` account or added a new email address. If this wasn’t you, please ignore this email.`
                                    };
                                mail_auth.sendMail(mail_options, (err, sent) => {
                                    if (!err) { console.log('Sent verify!'); }
                                });
                                // end verify email
                            }
                            if (res.locals.me.role == 2) {
                                return res.redirect(get_admin_url + '/users/')
                            } else {
                                return res.redirect(get_admin_url + '/users/profile')
                            }

                        } else {
                            return res.redirect(page_errors);
                        }
                    });
                } else {
                    return res.redirect(page_errors);
                }
            });
        }
    },
    delete: (req, res, next) => { // done
        var _id = (req.body._id && req.body._id != null && req.body._id != '' && typeof req.body._id !== 'undefined') ? req.body._id : undefined;
        if (_id) {
            m_users.deleteOne({ _id: _id }, (err, result) => {
                if (result) {
                    return res.redirect(get_admin_url + '/users');
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
module.exports = users_controller;