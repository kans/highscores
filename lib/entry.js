/*
 *  Copyright 2011 Rackspace
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 *
 */

var optimist = require('optimist');

var app = require('./web/app');
var settings = require('./settings');

exports.run = function() {
  var argv;

  optimist = optimist.usage('Usage: $0 [-l 0.0.0.0] -p [port] -d [devops.json] [-c] [-h]');
  optimist = optimist['default']('l', '0.0.0.0');
  optimist = optimist.describe('l', 'Listening address');
  optimist = optimist['default']('p', 3000);
  optimist = optimist['default']('d', settings.saved_crawls_path);
  optimist = optimist['default']('c', false);
  optimist = optimist['default']('h', false);
  optimist = optimist.alias('c', 'crawler');
  optimist = optimist.describe('c', 'Run the crawler to update devops.json');
  optimist = optimist.alias('h', 'help');
  optimist = optimist.describe('h', 'Print usage help');
  argv = optimist.argv;

  if (argv.h) {
    optimist.showHelp(console.log);
  } else if (argv.c) {
    crawler.run(argv);
  } else {
    app.run(argv.p, argv.d, argv.l);
    console.log("Highscores now listening on", argv.l + ":" + argv.p);
  }
};
