var express = require('express');
var session = require('express-session');
var util = require('./lib/utility');
var partials = require('express-partials');
var bodyParser = require('body-parser');
var bcrypt = require('bcrypt-nodejs');
var Promise = require('bluebird');
var compareAsync = Promise.promisify(bcrypt.compare);


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
app.use(session({
  secret: 'superSecretSessionKey',
  resave: false,
  saveUninitialized: true
}));



app.get('/', util.restrict,
function(req, res) {
  res.render('index');
});

app.get('/create', util.restrict,
function(req, res) {
  res.render('index');
});

app.get('/signup',
function(req, res) {
  res.render('signup');
});

app.get('/login', 
function(req, res) {
  res.render('login');
});

app.get('/logout', 
function(req, res) {
  req.session.destroy(function() {
    res.redirect('/');
  });
});

app.get('/links', util.restrict,
function(req, res) {
  Links.reset().fetch().then(function(links) {
    res.send(200, links.models);
  });
});

app.post('/links', 
function(req, res) {
  var uri = req.body.url;

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
          baseUrl: req.headers.origin
        })
        .then(function(newLink) {
          res.send(200, newLink);
        });
      });
    }
  });
});

app.post('/signup', 
function(req, res) {
  var username = req.body.username;
  var password = req.body.password;

  Users.query(function(qb) {
    console.log('queried username: ', username);
    qb.where('username', '=', username);
  })
    .fetchOne()
    .then(function(user) {
      if (user) {
        //if user exists already then we need to redirect it to login
        res.redirect('/');
      } else { 
        Users.create({
          // TODO: escape these inputs with Bookshelf's model.escape, here or in the model
          username: username,
          password: password
        })
        .then(function(newUser) {
          res.redirect('/');
        });
      }
    })
    .catch(function(error) {
      throw {
        type: 'User adding error',
        message: 'Failed to add user: ' + error
      };
    });
});

app.post('/login', 
function(req, res) {
  var username = req.body.username;
  var password = req.body.password;
  Users.query(function(qb) {
    qb.where('username', '=', username);
  })
    .fetchOne()
    .then(function(user) {
      if (user) { // if user exists, check password
        var hash = user.attributes.password;
        return compareAsync(password, hash);   
      } else { // if user does not exist, keep on login page
        res.redirect('/login');
      }
    })
    .then(function(passwordMatches) {
      if (passwordMatches) { // if password matches, start a session
        req.session.regenerate(function() {
          req.session.user = username;
          res.redirect('/');
        });
      } else { // if password doesn't match, keep on login page
        res.redirect('/login');
      }
    })
    .catch(function(error) {
      console.log('error on login, ', error);
    });
});


/************************************************************/
// Write your authentication routes here
/************************************************************/



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
        linkId: link.get('id')
      });

      click.save().then(function() {
        link.set('visits', link.get('visits') + 1);
        link.save().then(function() {
          return res.redirect(link.get('url'));
        });
      });
    }
  });
});

console.log('Shortly is listening on 4568');
app.listen(4568);
