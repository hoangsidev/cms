/* https://hoangsi.com/ */
var configs = require('./config/configs.js'),
    app = configs.app(),
    express = configs.express(),
    session = configs.session(),
    body_parser = configs.body_parser(),
    path = configs.path(),
    fs = configs.fs(),
    method_override = configs.method_override(),
    server = require('http').Server(app);

global.io = require('socket.io')(server);  // golobal để sử dụng trên tất cả file

server.listen(process.env.PORT || 3000, () => { console.log('Server runing with port 3000 !!!!'); });
console.log();
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
/* ----- */
var frontend_controller = require('./controllers/frontend/frontend_controller.js');
/* --------------------------------------------------------------------------------------- */

// BACKEND

function auth(req, res, next) {
    if (!req.session.me) {
        res.redirect('/signin');
    } else {
        next();
    }
}

app.route('/backend/404')
    .get(auth, backend_controller.not_found)

app.route('/backend/error')
    .get(auth, backend_controller.error)

app.route('/backend/dashboard')
    .get(auth, backend_controller.dashboard)

// posts
app.route('/backend/posts')
    .get(auth, posts_controller.posts)

app.route('/backend/posts/page/:page')
    .get(auth, posts_controller.posts)

app.route('/backend/posts/create')
    .get(auth, posts_controller.create)
    .post(auth, posts_controller.create)

app.route('/backend/posts/update/:_id')
    .get(auth, posts_controller.update)

app.route('/backend/posts/update')
    .put(auth, posts_controller.update)

app.route('/backend/posts/delete')
    .delete(auth, posts_controller.delete)
// end posts

// users
app.route('/signin')
    .get(users_controller.signin)
    .post(users_controller.signin)
app.route('/signup')
    .get(users_controller.signup)
    .post(users_controller.signup)
app.route('/verify/:username/:key')
    .get(users_controller.verify)
app.route('/signout')
    .get(users_controller.signout)
app.route('/password_reset')
    .get(users_controller.password_reset)
    .post(users_controller.password_reset)
    .put(users_controller.password_reset)
/* */
app.route('/backend/users')
    .get(auth, users_controller.users)

app.route('/backend/users/page/:page')
    .get(auth, users_controller.users)

app.route('/backend/users/create')
    .get(auth, users_controller.create)
    .post(auth, users_controller.create)

app.route('/backend/users/profile')
    .get(auth, users_controller.profile)

app.route('/backend/users/update/:_id')
    .get(auth, users_controller.update)

app.route('/backend/users/update')
    .put(auth, users_controller.update)

app.route('/backend/users/delete')
    .delete(auth, users_controller.delete)
// end users

// End BACKEND

// FRONTEND
app.route('/')
    .get(frontend_controller.index)


// End FRONTEND
/* --------------------------------------------------------------------------------------- */