var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var session = require(`express-session`)
var flash = require(`connect-flash`)
var mongoose = require(`mongoose`)
var MongoStore = require(`connect-mongo`)

require(`dotenv`).config()

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var adminRouter = require('./routes/admin');
var productRouter = require('./routes/product');


var app = express();

require(`./modules/passport`)

//connecting to database

mongoose.connect(`mongodb://127.0.0.1:27017/expense-tracker`, (err) => {
  if(err) next(err)
  console.log(`Database Connected Successfully`)
})

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({mongoUrl: `mongodb://127.0.0.1:27017/expense-tracker`})
}))

app.use(flash())

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/admin', adminRouter);
app.use('/product', productRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
