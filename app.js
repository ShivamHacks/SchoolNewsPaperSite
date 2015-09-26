//var favicon = require('serve-favicon');
var logger = require('morgan');
//var cookieParser = require('cookie-parser');

// body parser setup
//var bodyParser = require('body-parser');
//app.use(bodyParser.json());
//app.use(bodyParser.urlencoded({ extended: false }));




// MAIN APP

var express = require('express');
var path = require('path');

var app = express();

// server
var server = require('http').Server(app);

var port = '3000';
app.set('port', port);

server.listen(port, function(){
  console.log('listening on: ' + this.address().port);
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hjs');

// filesystem setup
var fs = require('fs');
var multipart = require('connect-multiparty');
var multipartMiddleware = multipart();
var Datauri = require('datauri');

// router setup
var router = express.Router();
app.use(router);  
app.use(express.static(path.join(__dirname, 'public')));

// router actions
router.get('/', function (req, res, next) {
  res.render('index', {});
});

// Adding articles (TODO: need to put authentication mechanism)

router.get('/add', function (req, res, next) {
  res.render('add', {});
});

router.post('/add', multipartMiddleware, function (req, res) {
  var article = {
    title: req.body.atitle,
    author: req.body.aauthor,
    category: req.body.acategory,
    image: Datauri(req.files.aimage.path),
    link: '/articles/' + encodeURI(req.body.atitle),
    month: req.body.amonth,
    text: req.body.atext.replace(/(?:\r\n|\r|\n)/g, '<br>')
  };
  fs.writeFile('./articles/' + req.body.atitle + '.json', JSON.stringify(article), 'utf8', function() {
    console.log('successful article save');
  });

  res.send(200);
});

// Reading Articles

router.get('/articles', function (req, res, next) {
  var files = fs.readdirSync('./articles');
  var articles = [];
  for (var i in files) {
    if (path.extname(files[i]) == '.json') {
      articles.push(require('./articles/' + files[i]));
    }
  }
  res.render('articles', {
    articles: articles
  });
});

router.get('/articles/:title', function (req, res, next) {
  fs.exists('./articles/' + req.params.title + '.json', function(exists) {
    if (exists) {
      var requestedArticle = require('./articles/' + req.params.title + '.json');
      res.render('article', requestedArticle);
      console.log('Requested article: ' + req.params.title);
    } else {
      res.send('error');
    }
  });
});






// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
//app.use(cookieParser());
//app.use(express.static(path.join(__dirname, 'public')));

//app.use('/', routes);
//app.use('/users', users);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;
