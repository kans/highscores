var express = require('express');
var path = require('path');
var fs = require('fs');

var _ = require('underscore');

var routes = require('./routes');
var settings = require('../settings');
var poller= require('./poller');

exports.run = function(port, host) {
  var app;
  var base_path = path.join(__dirname, '../..');

  app = express.createServer();
  app.set('views', TEMPLATE_DIR);
  app.set('view engine', 'jade');
  app.set('view options', {layout: false});
  app.use(middleware.logger());

  if (settings.testing === true){
    _app.enable('testing');
  }

  app.poller = poller.start();
  // app.use('/static', express.static(path.join(__dirname, '..', '..', 'extern')));
  // app.use('/static', express.static(path.join(__dirname, '..', '..', 'static')));

  /* setup middleware */

  routes.install(app);

  app.listen(port, host);
};
