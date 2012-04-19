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

var assert_has_keys = function(obj, keys){
	_.each(keys, function(key){
		if (!_.has(obj, key)){
			throw new Error('spec is missing key: '+key);
		}
	});
};
exports.load = function(app){
  var devops_dir = path.join(__dirname, '..', '..', settings.saved_crawls_path);
  var all_devops = {};

  _.each(settings.devopsjson_uris, function(uri, name){
    var this_path = path.join(devops_dir, name);
    var version_one_spec;
    var github_spec;
    var devops;
    var json;
    var err;
    try{
			json = fs.readFileSync(this_path);
			devops = JSON.parse(json);

			github_spec = devops.related_apis.github;
			assert_has_keys(github_spec, ['org', 'username', 'apikey']);

			version_one_spec = devops.related_apis.version_one;
			assert_has_keys(version_one_spec, ['host', 'port', 'project', 'auth']);

			all_devops[name] = {version_one: version_one_spec, github: github_spec};

		}catch(err){
			console.warn('Couldn\'t load devops file: ', name, '. This is maybe ok.');
		}
  });
  return all_devops;
};
