/*console.log("run app.js");
var express = require('express');
var cookieParser = require('cookie-parser');
var compress = require('compression');
var session = require('express-session');
var bodyParser = require('body-parser');
var logger = require('morgan');
var errorHandler = require('errorhandler');
var csrf = require('lusca').csrf();
var methodOverride = require('method-override');

var _ = require('lodash');
var MongoStore = require('connect-mongo')({ session: session });
var flash = require('express-flash');
var path = require('path');
var mongoose = require('mongoose');
var passport = require('passport');
var expressValidator = require('express-validator');
var connectAssets = require('connect-assets');

var homeController = require('./controllers/home');
var userController = require('./controllers/user');
var apiController = require('./controllers/api');
var contactController = require('./controllers/contact');
var infoController = require('./controllers/info');


var secrets = require('./config/secrets');
var passportConf = require('./config/passport');

var app = express();

mongoose.connect(secrets.db);
mongoose.connection.on('error', function() {
  console.error('MongoDB Connection Error. Make sure MongoDB is running on ' + secrets.db);
});

var hour = 3600000;
var day = hour * 24;
var week = day * 7;

var csrfExclude = ['/url1', '/url2'];

app.set('port', process.env.OPENSHIFT_NODEJS_PORT ||  process.env.OPENSHIFT_INTERNAL_PORT || 80);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(compress());
app.use(connectAssets({
  paths: ['public/css', 'public/js'],
  helperContext: app.locals
}));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(expressValidator());
app.use(methodOverride());
app.use(cookieParser());
app.use(session({
  secret: secrets.sessionSecret,
  store: new MongoStore({
    url: secrets.db,
    auto_reconnect: true
  })
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());
app.use(function(req, res, next) {
  // CSRF protection.
  if (_.contains(csrfExclude, req.path)) return next();
  csrf(req, res, next);
});
app.use(function(req, res, next) {
  // Make user object available in templates.
  res.locals.user = req.user;
  next();
});
app.use(function(req, res, next) {
  // Remember original destination before login.
  var path = req.path.split('/')[1];
  if (/auth|login|logout|signup|img|fonts|favicon/i.test(path)) {
    return next();
  }
  req.session.returnTo = req.path;
  next();
});
app.use(express.static(path.join(__dirname, 'public'), { maxAge: week }));

app.get('/', homeController.index);
app.get('/login', userController.getLogin);
app.post('/login', userController.postLogin);
app.get('/logout', userController.logout);
app.get('/forgot', userController.getForgot);
app.post('/forgot', userController.postForgot);
app.get('/reset/:token', userController.getReset);
app.post('/reset/:token', userController.postReset);
app.get('/signup', userController.getSignup);
app.post('/signup', userController.postSignup);
app.get('/contact', contactController.getContact);
app.post('/contact', contactController.postContact);
app.get('/account', passportConf.isAuthenticated, userController.getAccount);
app.post('/account/profile', passportConf.isAuthenticated, userController.postUpdateProfile);
app.post('/account/password', passportConf.isAuthenticated, userController.postUpdatePassword);
app.post('/account/delete', passportConf.isAuthenticated, userController.postDeleteAccount);
app.get('/account/unlink/:provider', passportConf.isAuthenticated, userController.getOauthUnlink);

app.get('/learn/timeline', passportConf.isAuthenticated, infoController.timeline);
app.get('/learn/info/:id', passportConf.isAuthenticated, infoController.learn);
app.get('/learn/next/:id', passportConf.isAuthenticated, infoController.next);
app.get('/learn/demo', infoController.demo);
app.get('/learn/result/:score', infoController.result);
app.get('/learn/update', passportConf.isAuthenticated, infoController.update);
app.get('/learn/test', passportConf.isAuthenticated, infoController.test);
app.get('/learn/ignore/:id', infoController.ignore);
app.get('/learn/mnemo', infoController.mnemo);

app.get('/api', apiController.getApi);
app.get('/api/lastfm', apiController.getLastfm);
app.get('/api/nyt', apiController.getNewYorkTimes);
app.get('/api/aviary', apiController.getAviary);
app.get('/api/steam', apiController.getSteam);
app.get('/api/stripe', apiController.getStripe);
app.post('/api/stripe', apiController.postStripe);
app.get('/api/scraping', apiController.getScraping);
app.get('/api/twilio', apiController.getTwilio);
app.post('/api/twilio', apiController.postTwilio);
app.get('/api/clockwork', apiController.getClockwork);
app.post('/api/clockwork', apiController.postClockwork);
app.get('/api/foursquare', passportConf.isAuthenticated, passportConf.isAuthorized, apiController.getFoursquare);
app.get('/api/tumblr', passportConf.isAuthenticated, passportConf.isAuthorized, apiController.getTumblr);
app.get('/api/facebook', passportConf.isAuthenticated, passportConf.isAuthorized, apiController.getFacebook);
app.get('/api/github', passportConf.isAuthenticated, passportConf.isAuthorized, apiController.getGithub);
app.get('/api/twitter', passportConf.isAuthenticated, passportConf.isAuthorized, apiController.getTwitter);
app.post('/api/twitter', passportConf.isAuthenticated, passportConf.isAuthorized, apiController.postTwitter);
app.get('/api/venmo', passportConf.isAuthenticated, passportConf.isAuthorized, apiController.getVenmo);
app.post('/api/venmo', passportConf.isAuthenticated, passportConf.isAuthorized, apiController.postVenmo);
app.get('/api/linkedin', passportConf.isAuthenticated, passportConf.isAuthorized, apiController.getLinkedin);
app.get('/api/instagram', passportConf.isAuthenticated, passportConf.isAuthorized, apiController.getInstagram);
app.get('/api/yahoo', apiController.getYahoo);

app.get('/auth/instagram', passport.authenticate('instagram'));
app.get('/auth/instagram/callback', passport.authenticate('instagram', { failureRedirect: '/login' }), function(req, res) {
  res.redirect(req.session.returnTo || '/');
});
app.get('/auth/facebook', passport.authenticate('facebook', { scope: ['email', 'user_location'] }));
app.get('/auth/facebook/callback', passport.authenticate('facebook', { failureRedirect: '/login' }), function(req, res) {
  res.redirect(req.session.returnTo || '/');
});
app.get('/auth/github', passport.authenticate('github'));
app.get('/auth/github/callback', passport.authenticate('github', { failureRedirect: '/login' }), function(req, res) {
  res.redirect(req.session.returnTo || '/');
});
app.get('/auth/google', passport.authenticate('google', { scope: 'profile email' }));
app.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/login' }), function(req, res) {
  res.redirect(req.session.returnTo || '/');
});
app.get('/auth/twitter', passport.authenticate('twitter'));
app.get('/auth/twitter/callback', passport.authenticate('twitter', { failureRedirect: '/login' }), function(req, res) {
  res.redirect(req.session.returnTo || '/');
});
app.get('/auth/linkedin', passport.authenticate('linkedin', { state: 'SOME STATE' }));
app.get('/auth/linkedin/callback', passport.authenticate('linkedin', { failureRedirect: '/login' }), function(req, res) {
  res.redirect(req.session.returnTo || '/');
});

app.get('/auth/foursquare', passport.authorize('foursquare'));
app.get('/auth/foursquare/callback', passport.authorize('foursquare', { failureRedirect: '/api' }), function(req, res) {
  res.redirect('/api/foursquare');
});
app.get('/auth/tumblr', passport.authorize('tumblr'));
app.get('/auth/tumblr/callback', passport.authorize('tumblr', { failureRedirect: '/api' }), function(req, res) {
  res.redirect('/api/tumblr');
});
app.get('/auth/venmo', passport.authorize('venmo', { scope: 'make_payments access_profile access_balance access_email access_phone' }));
app.get('/auth/venmo/callback', passport.authorize('venmo', { failureRedirect: '/api' }), function(req, res) {
  res.redirect('/api/venmo');
});

app.use(errorHandler());

var ipaddr = process.env.OPENSHIFT_NODEJS_IP || process.env.OPENSHIFT_INTERNAL_IP || "localhost";
console.log("Starting on --> " + ipaddr + ":" + app.get('port') + " in " + app.get('env'));
app.listen(ipaddr, app.get('port'), function() {
  console.log('Express server listening on port %d in %s mode', app.get('port'), app.get('env'));
});

///BOOTSTRAP
console.log("Bootstrap");
var Info = require('./models/Info');

var errorFunction = function(err) {
  if (err) console.log("Save error " + err);
};

Info.count({ }, function (err, count) {
  if (err) {
    console.log("Error " + err);
  }
  console.log('There are %d infos', count);
  if(count > 0) return;
  
//    (new Info({
//        year: "966",
//        name: "Chrzest Polski",
//        text: "Chrzest Polski   Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus mattis magna nec gravida consectetur. Etiam volutpat cursus odio nec accumsan. Cras iaculis nibh vel purus euismod, ac tempor neque ultricies. Duis pellentesque erat id semper ornare. Proin feugiat venenatis elementum. Praesent consequat dictum orci a iaculis. Sed vitae augue sollicitudin, vehicula purus id, consectetur justo. Mauris volutpat diam mi. Pellentesque luctus pulvinar nulla eu rutrum. Maecenas scelerisque, eros at dapibus porta, nisi libero consectetur magna, at vehicula risus arcu sed diam. Suspendisse quis lorem fringilla, sollicitudin eros ac, luctus nibh. Nullam ullamcorper posuere lacus, et cursus turpis dictum sit amet.",
//        image: "http://upload.wikimedia.org/wikipedia/commons/7/72/Zaprowadzenie_chrzescijanstwa_965_Matejko.JPG",
//        bought: true,
//        mnemoniks: [{
//          type: "image",
//          link: "http://upload.wikimedia.org/wikipedia/commons/thumb/a/a1/Matejko_Battle_of_Grunwald.jpg/300px-Matejko_Battle_of_Grunwald.jpg"
//        }]
//    })).save(errorFunction);
//  
//    (new Info({
//        year: "1410",
//        name: "Bitwa pod Grunwaldem",
//        text: "Bitwa pod Grunwaldem   Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus mattis magna nec gravida consectetur. Etiam volutpat cursus odio nec accumsan. Cras iaculis nibh vel purus euismod, ac tempor neque ultricies. Duis pellentesque erat id semper ornare. Proin feugiat venenatis elementum. Praesent consequat dictum orci a iaculis. Sed vitae augue sollicitudin, vehicula purus id, consectetur justo. Mauris volutpat diam mi. Pellentesque luctus pulvinar nulla eu rutrum. Maecenas scelerisque, eros at dapibus porta, nisi libero consectetur magna, at vehicula risus arcu sed diam. Suspendisse quis lorem fringilla, sollicitudin eros ac, luctus nibh. Nullam ullamcorper posuere lacus, et cursus turpis dictum sit amet.",
//        image: "http://historia.org.pl/wp-content/uploads/2010/07/bitwa-pod-Grunwaldem.jpg",
//        bought: true,
//        mnemoniks: [{
//          type: "image",
//          link: "http://upload.wikimedia.org/wikipedia/commons/thumb/a/a1/Matejko_Battle_of_Grunwald.jpg/300px-Matejko_Battle_of_Grunwald.jpg"
//        }]
//    })).save(errorFunction);
//
//    (new Info({
//        year: "1453",
//        name: "Upadek Konstantynopola",
//        text: "Upadek Konstantynopola   Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus mattis magna nec gravida consectetur. Etiam volutpat cursus odio nec accumsan. Cras iaculis nibh vel purus euismod, ac tempor neque ultricies. Duis pellentesque erat id semper ornare. Proin feugiat venenatis elementum. Praesent consequat dictum orci a iaculis. Sed vitae augue sollicitudin, vehicula purus id, consectetur justo. Mauris volutpat diam mi. Pellentesque luctus pulvinar nulla eu rutrum. Maecenas scelerisque, eros at dapibus porta, nisi libero consectetur magna, at vehicula risus arcu sed diam. Suspendisse quis lorem fringilla, sollicitudin eros ac, luctus nibh. Nullam ullamcorper posuere lacus, et cursus turpis dictum sit amet.",
//        image: "http://upload.wikimedia.org/wikipedia/commons/thumb/b/b6/Zonaro_GatesofConst.jpg/280px-Zonaro_GatesofConst.jpg",
//        mnemoniks: [{
//          type: "image",
//          link: "http://upload.wikimedia.org/wikipedia/commons/thumb/b/b6/Zonaro_GatesofConst.jpg/280px-Zonaro_GatesofConst.jpg"
//        }]
//    })).save(errorFunction);
  
      (new Info({
        year: "Paleolitic, Neolitic, Chalclitic",
        name: "Name Stone Age Periods in order",
        text: "Stone Age Periods   Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus mattis magna nec gravida consectetur. Etiam volutpat cursus odio nec accumsan. Cras iaculis nibh vel purus euismod, ac tempor neque ultricies. Duis pellentesque erat id semper ornare. Proin feugiat venenatis elementum. Praesent consequat dictum orci a iaculis. Sed vitae augue sollicitudin, vehicula purus id, consectetur justo. Mauris volutpat diam mi. Pellentesque luctus pulvinar nulla eu rutrum. Maecenas scelerisque, eros at dapibus porta, nisi libero consectetur magna, at vehicula risus arcu sed diam. Suspendisse quis lorem fringilla, sollicitudin eros ac, luctus nibh. Nullam ullamcorper posuere lacus, et cursus turpis dictum sit amet.",
        image: "http://bigtreetop.files.wordpress.com/2008/07/cave_painting.jpg",
        bought: true,
        chapter: "CHAPTER 1 – THE START OF  CIVILIZATION",
        mnemoniks: [{
          type: "image",
          link: "test"
        }]
    })).save(errorFunction);
  
    (new Info({
        year: "476",
        name: "When was the Fall of Roman Empire?",
        text: "Fall of Roman Empire?   Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus mattis magna nec gravida consectetur. Etiam volutpat cursus odio nec accumsan. Cras iaculis nibh vel purus euismod, ac tempor neque ultricies. Duis pellentesque erat id semper ornare. Proin feugiat venenatis elementum. Praesent consequat dictum orci a iaculis. Sed vitae augue sollicitudin, vehicula purus id, consectetur justo. Mauris volutpat diam mi. Pellentesque luctus pulvinar nulla eu rutrum. Maecenas scelerisque, eros at dapibus porta, nisi libero consectetur magna, at vehicula risus arcu sed diam. Suspendisse quis lorem fringilla, sollicitudin eros ac, luctus nibh. Nullam ullamcorper posuere lacus, et cursus turpis dictum sit amet.",
        image: "http://media.tumblr.com/tumblr_lv70ixfhmK1qgga3f.jpg",
        bought: true,
        chapter: "CHAPTER 3 – ROMAN EMPIRE",
        mnemoniks: [{
          type: "image",
          link: "test"
        }]
    })).save(errorFunction);
  
    (new Info({
        year: "Menorah",
        name: "What is Judaism Symbol?",
        text: "Judaism   Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus mattis magna nec gravida consectetur. Etiam volutpat cursus odio nec accumsan. Cras iaculis nibh vel purus euismod, ac tempor neque ultricies. Duis pellentesque erat id semper ornare. Proin feugiat venenatis elementum. Praesent consequat dictum orci a iaculis. Sed vitae augue sollicitudin, vehicula purus id, consectetur justo. Mauris volutpat diam mi. Pellentesque luctus pulvinar nulla eu rutrum. Maecenas scelerisque, eros at dapibus porta, nisi libero consectetur magna, at vehicula risus arcu sed diam. Suspendisse quis lorem fringilla, sollicitudin eros ac, luctus nibh. Nullam ullamcorper posuere lacus, et cursus turpis dictum sit amet.",
        image: "http://media.web.britannica.com/eb-media/31/91831-004-851FB7EC.jpg",
        bought: true,
        chapter: "CHAPTER 2 – ANCIENT GREEK",
        mnemoniks: [{
          type: "image",
          link: "test"
        }]
    })).save(errorFunction);
  
      (new Info({
        year: "Mesopotamia",
        name: "Name for the area of the Tigris–Euphrates river system",
        text: "Mesopotamia   Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus mattis magna nec gravida consectetur. Etiam volutpat cursus odio nec accumsan. Cras iaculis nibh vel purus euismod, ac tempor neque ultricies. Duis pellentesque erat id semper ornare. Proin feugiat venenatis elementum. Praesent consequat dictum orci a iaculis. Sed vitae augue sollicitudin, vehicula purus id, consectetur justo. Mauris volutpat diam mi. Pellentesque luctus pulvinar nulla eu rutrum. Maecenas scelerisque, eros at dapibus porta, nisi libero consectetur magna, at vehicula risus arcu sed diam. Suspendisse quis lorem fringilla, sollicitudin eros ac, luctus nibh. Nullam ullamcorper posuere lacus, et cursus turpis dictum sit amet.",
        image: "http://tectonicablog.com/wp-content/uploads/2012/02/The-palaces-of-Nimroud-455x274.jpg",
        bought: true,
        chapter: "CHAPTER 1 – THE START OF  CIVILIZATION",
        mnemoniks: [{
          type: "image",
          link: "test"
        }]
    })).save(errorFunction);
  
    (new Info({
        year: "191",
        name: "Battle of Thermopylae",
        text: "Battle of Thermopylae   Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus mattis magna nec gravida consectetur. Etiam volutpat cursus odio nec accumsan. Cras iaculis nibh vel purus euismod, ac tempor neque ultricies. Duis pellentesque erat id semper ornare. Proin feugiat venenatis elementum. Praesent consequat dictum orci a iaculis. Sed vitae augue sollicitudin, vehicula purus id, consectetur justo. Mauris volutpat diam mi. Pellentesque luctus pulvinar nulla eu rutrum. Maecenas scelerisque, eros at dapibus porta, nisi libero consectetur magna, at vehicula risus arcu sed diam. Suspendisse quis lorem fringilla, sollicitudin eros ac, luctus nibh. Nullam ullamcorper posuere lacus, et cursus turpis dictum sit amet.",
        image: "http://www.logoi.com/pastimages/img/battle_2.jpg",
        bought: false,
        chapter: "CHAPTER 2 – ANCIENT GREEK",
        mnemoniks: [{
          type: "image",
          link: "test"
        }]
    })).save(errorFunction);
});

///BOOTSTRAP - end

module.exports = app;
*/
console.log("dummy");
module.exports = {};