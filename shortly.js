var express = require('express');
var util = require('./lib/utility');
var partials = require('express-partials');
var bodyParser = require('body-parser');
var session = require('express-session');

var db = require('./app/config');
var Users = require('./app/collections/users');
var User = require('./app/models/user');
var Links = require('./app/collections/links');
var Link = require('./app/models/link');
var Click = require('./app/models/click');


var app = express();

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(partials());
// Parse JSON (uniform resource locators)
app.use(bodyParser.json());
// Parse forms (signup/login)
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/public'));
app.use(session({secret: '<mysecret>', 
                 saveUninitialized: true,
                 resave: true}));


app.get('/', 
//if session has started
  //render index
//else
function(req, res) {
  if(req.session.user){ //&& req.session.cookie._expires ! = ???
    // console.log('session: ', req.session);
    res.render('index');
  } else {
    res.render('login');
  }
});

app.get('/create', 
function(req, res) {
  res.render('index');
});

app.get('/links', 
function(req, res) {
  var userId = req.session.user_id;
  console.log('in links get request, userId: ', userId);
//only get links for that session
  //req.session.user 
  Links.query('where', 'user_id', '=', userId).fetch()
  .then(function(links) {
    console.log('in links get request, links.models: ', links.models);
    res.send(200, links.models);
  });
});

app.get('/signup',
function(req, res) {
  res.render('signup');
});

app.get('/login',
function(req, res) {
  res.render('login');
});

app.post('/links', 
function(req, res) {
  var uri = req.body.url;
  var username = req.session.user;
  var userId = req.session.user_id;
  console.log('links post req.session: ', req.session);
  console.log('links post user id: ', userId);

  // console.log('req.session.user: ', req.session);

  if (!util.isValidUrl(uri)) {
    console.log('Not a valid url: ', uri);
    return res.send(404);
  }

  new Link({ url: uri }).fetch().then(function(found) {
    if (found) {
      res.send(200, found.attributes);
    } else {
      util.getUrlTitle(uri, function(err, title) {
        if (err) {
          console.log('Error reading URL heading: ', err);
          return res.send(404);
        }

        Links.create({
          url: uri,
          title: title,
          base_url: req.headers.origin,
          user_id: userId
        })
        .then(function(newLink) {
          console.log('new link: ', newLink);
          // res.session.save();
          res.send(200, newLink);
        });
      });
    }
  });
});

/************************************************************/
// Write your authentication routes here
/************************************************************/
app.post('/signup',
function(req, res) {
  var user = req.body.username;
  var pw = req.body.password;
  
  new User({username: user}).fetch().then(function(found){
    if (found) {
      res.render('/signup');
    } else {
      Users.create({
        username: user,
        password: pw
      }).then(function(newUser){
        // req.session.regenerate(function(){
          req.session.user = user;
          res.redirect('/'); //include session id info? 
        // });
      });
    }
  });
});

app.post('/login',
function(req, res) {
  var user = req.body.username;
  var pw = req.body.password;
  
  new User({username: user, password: pw}).fetch().then(function(found){
    if (found) {
      // req.session.regenerate(function(){
        req.session.user = user;
        req.session.user_id =  found.get('id');
        // console.log('the session', req.session);
        res.redirect('/'); //include session
        // console.log('our res: ', res);

      // });
    } else {
      res.redirect('/login');
    }
  });
});


/************************************************************/
// Handle the wildcard route last - if all other routes fail
// assume the route is a short code and try and handle it here.
// If the short-code doesn't exist, send the user to '/'
/************************************************************/

app.get('/*', function(req, res) {
  new Link({ code: req.params[0] }).fetch().then(function(link) {
    if (!link) {
      res.redirect('/');
    } else {
      var click = new Click({
        link_id: link.get('id')
      });

      click.save().then(function() {
        link.set('visits', link.get('visits')+1);
        link.save().then(function() {
          return res.redirect(link.get('url'));
        });
      });
    }
  });
});

console.log('Shortly is listening on 4568');
app.listen(4568);
