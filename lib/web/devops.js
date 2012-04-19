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
var fs = require('fs');
var path = require('path');

var _ = require('underscore');

var settings = require('../settings');

exports.load = function(app){
	var devops = {};
  var devops_dir = path.join(__dirname, '..', '..', settings.saved_crawls_path);

  _.each(settings.devopsjson_uris, function(uri, name){
    var this_path = path.join(devops_dir, name);
    var json;
    var err;
    try{
			json = fs.readFileSync(this_path);
			devops[name] = JSON.parse(json);
		}catch(err){
			console.warn('Couldn\'t load devops file: ', name, 'with err: ', err);
		}
  });
  return devops;
};
