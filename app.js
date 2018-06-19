/* https://hoangsi.com/ */
var configs = require('./configs/configs.js'),
    app = configs.app(),
    express = configs.express(),
    session = configs.session(),
    body_parser = configs.body_parser(),
    path = configs.path(),
    fs = configs.fs(),
    method_override = configs.method_override(),
    server = require('http').Server(app),
    get_admin_url = configs.get_admin_url();

global.io = require('socket.io')(server);  // golobal để sử dụng trên tất cả file

server.listen(process.env.PORT || 3000, () => { console.log('Server runing with port 3000 !!!!'); });
/* --------------------------------------------------------------------------------------- */
app.use(body_parser.json()); // support json encoded bodies
app.use(body_parser.urlencoded({ extended: true })); // support encoded bodies
app.use(method_override('_method'));
app.use(express.static(__dirname + '/assets')); // thư mục public chứa hình, css,...
app.set('view engine', 'ejs'); // đặt template engine là EJS
app.set('views', __dirname + '/views'); // trỏ vào thư mục view để chứa các file template
app.use((req, res, next) => {
    session({
        secret: 'hoangsi', saveUninitialized: true, resave: true, maxAge: req.body.remember ? (24 * 60 * 60 * 1000 * 30) : null//, maxAge: 24 * 60 * 60 * 1000 * 30 // 30 ngày
    })(req, res, next);
});

app.use((req, res, next) => {
    res.locals.me = req.session.me ? req.session.me : null
    return next();
});

/* --------------------------------------------------------------------------------------- */
var backend_controller = require('./controllers/backend/backend_controller.js'),
    posts_controller = require('./controllers/backend/posts_controller.js'),
    users_controller = require('./controllers/backend/users_controller.js');
terms_controller = require('./controllers/backend/terms_controller.js');
/* ----- */
var frontend_controller = require('./controllers/frontend/frontend_controller.js');
/* --------------------------------------------------------------------------------------- */

// BACKEND

auth = (req, res, next) => {
    if (!req.session.me) {
        res.redirect('/signin');
    } else {
        next();
    }
}
app.get('/backend', (req, res, next) => {
    return res.redirect(get_admin_url + '/dashboard');
})
app.get('/backend/404', auth, backend_controller.not_found)
app.get('/backend/error', auth, backend_controller.error)
app.get('/backend/dashboard', auth, backend_controller.dashboard)

// posts
app.get(('/backend/:post_type'), auth, (req, res, next) => {
    if (req.params.post_type && req.params.post_type == 'users') {
        return users_controller.users(req, res, next);
    } else {
        return posts_controller.posts(req, res, next); // articles and pages
    }
})

app.get('/backend/:post_type/page/:page', auth, (req, res, next) => {
    if (req.params.post_type && req.params.post_type == 'users') {
        return users_controller.users(req, res, next);
    } else {
        return posts_controller.posts(req, res, next);
    }
})

app.route('/backend/:post_type/create')
    .get(auth, (req, res, next) => {
        if (req.params.post_type && req.params.post_type == 'users') {
            return users_controller.create(req, res, next);
        } else {
            return posts_controller.create(req, res, next);
        }
    })
    .post(auth, (req, res, next) => {
        if (req.params.post_type && req.params.post_type == 'users') {
            return users_controller.create(req, res, next);
        } else {
            return posts_controller.create(req, res, next);
        }
    })

app.get('/backend/:post_type/update/:_id', auth, (req, res, next) => {
    if (req.params.post_type && req.params.post_type == 'users') {
        return users_controller.update(req, res, next);
    } else {
        return posts_controller.update(req, res, next);
    }
})

app.put('/backend/:post_type/update', auth, (req, res, next) => {
    if (req.params.post_type && req.params.post_type == 'users') {
        return users_controller.update(req, res, next);
    } else {
        return posts_controller.update(req, res, next);
    }
})

app.get('/backend/users/profile', auth, users_controller.profile)

app.delete('/backend/:post_type/delete', auth, auth, (req, res, next) => {
    if (req.params.post_type && req.params.post_type == 'users') {
        return users_controller.delete(req, res, next);
    } else {
        return posts_controller.delete(req, res, next); // articles and pages
    }
})
// end posts

// terms
app.get('/backend/terms/:taxonomy', auth, terms_controller.terms)
app.get('/backend/terms/:taxonomy/page/:page', auth, terms_controller.terms)
app.post('/backend/terms/:taxonomy/create', auth, terms_controller.create)

app.get('/backend/terms/:taxonomy/update/:_id', auth, terms_controller.update)
app.put('/backend/terms/:taxonomy/update', auth, terms_controller.update)

app.delete('/backend/terms/:taxonomy/delete', auth, terms_controller.delete)
// end terms
// users
app.route('/signin')
    .get(users_controller.signin)
    .post(users_controller.signin)

app.route('/signup')
    .get(users_controller.signup)
    .post(users_controller.signup)

app.get('/verify/:username/:key', users_controller.verify)

app.get('/signout', users_controller.signout)

app.route('/password_reset')
    .get(users_controller.password_reset)
    .post(users_controller.password_reset)
    .put(users_controller.password_reset)
// end user

// End BACKEND

// FRONTEND
app.route('/')
    .get(frontend_controller.index)


// End FRONTEND
/* --------------------------------------------------------------------------------------- */