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
// Adding articles (TODO: need to put authentication mechanism)

router.get('/add', function (req, res, next) {
  res.render('add', {});
});

router.post('/add', multipartMiddleware, function (req, res) {
  var articleDate = new Date();
  articleDate.setDate(1);
  articleDate.setHours(0,0,0,0);
  var article = {
    title: req.body.atitle,
    author: req.body.aauthor,
    category: req.body.acategory,
    link: '/articles/' + encodeURI(req.body.atitle),
    publishDate: new Date(), // used for display
    articleDate: articleDate, // used for categorization
    month: req.body.amonth,
    tags: req.body.atags.split(/,\s*/),
    image: Datauri(req.files.aimage.path),
    text: req.body.atext.replace(/(?:\r\n|\r|\n)/g, '<br>')
  };
  fs.writeFile('./articles/' + req.body.atitle + '.json', JSON.stringify(article), 'utf8', function() {
    console.log('successful article save');
  });
  //res.redirect('/');
  res.send(200);
});

// ALSO, how to categorize articles (maybe by date published).

router.get('/', function (req, res, next) {
  res.render('index', {
    articles: getArticles
  });
});

router.post('/articles/search', multipartMiddleware, function (req, res) {
  var search = req.body.asearch.split(' ');
  var articles = getArticles();
  var matches = [];
  for (var i in articles) {
    if ('tags' in articles[i]) {
      for (var j in search) {
        if (articles[i].tags.indexOf(search[j]) > -1) {
          matches.push(articles[i]);
        }
      }
    }
  }
  if (matches.length > 0) {
    res.render('articles', {
      title: 'Search for ' + req.body.asearch,
      articles: matches
    });
  } else {
    res.render('articles', {
      title: 'No results found for ' + req.body.asearch 
    });
  }
});

router.get('/articles', function (req, res, next) {
  res.render('articles', {
    title: 'Most recent articles',
    articles: getArticles
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

router.get('/articles/tags/:tag', function (req, res, next) {
  var articles = getArticles();
  var matches = [];
  for (var i in articles) {
    if ('tags' in articles[i]) {
      if (articles[i].tags.indexOf(req.params.tag) > -1) {
        matches.push(articles[i]);
      }
    }
  }
  if (matches.length > 0) {
    res.render('articles', {
      title: 'Articles on ' + req.params.tag,
      articles: matches
    });
  } else {
    res.render('articles', {
      title: 'No results found for ' + req.params.tag 
    });
  }
});

function getArticles() {
  // RETRIEVE
  var files = fs.readdirSync('./articles');
  var articles = [];
  for (var i in files) {
    if (path.extname(files[i]) == '.json') {
      articles.push(require('./articles/' + files[i]));
    }
  }
  // SORT
  articles.sort(function(a,b){
    var c = new Date(a.articleDate);
    var d = new Date(b.articleDate);
    return d-c;
  });
  return articles;
}



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
