var mongoose = require('mongoose');
mongoose.connect('mongodb://root:123458@127.0.0.1:27017/nodecms'); 
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => {
    console.log('Connected mongodb !!!!')
});
module.exports = mongoose