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

var https = require('https');
var util = require('util');
var fs = require('fs');
var path = require('path');
var url = require('url');
var async = require('async');
var utils = require('./utils');
var settings = require('./settings');
var _ = require('underscore');

var generate_worker = function(name, devopsjson_url) {
  var options, parsed_url, filename, munged_devopsjson_url;
  var fixtures_auth;

  parsed_url = url.parse(devopsjson_url);

  options = {
    host: parsed_url.host,
    port: 80,
    path: parsed_url.path,
    method: 'GET'
  };
  console.log(options);
  fixtures_auth = settings.basic_auth_for_fixtures[name];
  if (fixtures_auth){
    options.path += util.format('?login=%s&token=%s', fixtures_auth.username, fixtures_auth.token);
  }
  filename = path.join(settings.saved_crawls_path, name);

  return function(next) {
    console.log('getting: '+JSON.stringify(options));
    utils.request_maker(
    options,
    function(error, data) {
      if(error){
        console.log("Error writing file ", devopsjson_url, filename, error);
        return next(error, null);
      }
      fs.writeFile(filename, JSON.stringify(data.data), function (err) {
        if (err) {
          console.log("Error writing file ", filename, err);
        } else {
          console.log("Wrote file: ", filename);
        }
        return next(null, 'done');
      });
    });
  };
};

// retrieve devops.json and save it to a file
exports.run = function() {
  var workers, key;
  workers = [];
  _.each(settings.devopsjson_uris, function(value, key){
    workers.push(generate_worker(key, value));
  });
  async.parallel(workers, function(err, results){
    console.log(results);
    process.exit(0);
  });
};