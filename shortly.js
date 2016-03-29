var express = require('express');
var session = require('express-session');
var util = require('./lib/utility');
var partials = require('express-partials');
var bodyParser = require('body-parser');
var bcrypt = require('bcrypt-nodejs');


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


app.get('/', 
function(req, res) {
  res.render('index');
});

app.get('/create', 
function(req, res) {
  res.render('index');
});

app.get('/links', 
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

  new User({ username: username, password: password }).fetch().then(function(found) {
    // fetch checks if item exists in table
    if (found) {
      res.send(200, found.attributes);
    } else {
      Users.create({
        // TODO: escape these inputs with Bookshelf's model.escape, here or in the model
        username: username
      })
      .then(function(newUser) {
        res.redirect('/');
      });
    }
  });
});

app.post('/login', 
function(req, res) {
  var username = req.body.username;
  var password = req.body.password;

  Users.query(function(qb) {
    console.log('queried username: ', username);
    qb.where('username', '=', username);
  })
    .fetchOne()
    .then(function(user) {
      var hash = user.attributes.password;
      console.log('queried password: ', password);
      bcrypt.compare(password, hash, function(err, res) {
        if (err) {
          console.log('There was an error: ', err);
        } else if (res) {
          console.log('Yo that password matches ya\'ll! res is ', res);
          // start a session
        } else {
          console.log('Incorrect login!');
        }
      });
    })
    .catch(function(error) {
      console.log('error, ', error);
    });
});
  // fetch checks if item exists in table
  
  // // check if user exists
  // if (found) {
  // // if user exists,

  //   // retrieve hashed password via db query
  //   // compare hashed password to password (with bcrypt.compare)
  //   // if fails
  //     // keep user on login page (maybe with message that it failed)
  //   // if succeeds
  //     // start a new session saving some session/cookie information
  //     // redirect to homepage '/'

  // } else {
  //   // if fails, return error
  //   // send error 'please create a username before signing in'
  // }

  // new User({ username: username, password: password }).fetch().then(function(found) {
  //   // fetch checks if item exists in table
  //   if (found) {
  //     res.send(200, found.attributes);
  //   } else {
  //     Users.create({
  //       // TODO: escape these inputs with Bookshelf's model.escape, here or in the model
  //       username: username
  //     })
  //     .then(function(newUser) {
  //       res.redirect('/');
  //     });
  //   }
  // });
// });

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
