
var express = require('express'),
    app = express(),
    sass = require('node-sass-middleware');

app.use(sass({
  src: __dirname + '/client/scss',
  dest: __dirname + '/client/css',
  prefix: '/css',
  debug: true
}));

app.use(express.static(__dirname + '/client'));
app.use('/node_modules', express.static(__dirname + '/node_modules'));

app.listen(3000, function (port) {
  console.log('server listening');
});