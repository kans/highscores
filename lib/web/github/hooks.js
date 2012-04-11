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

var async = require('async');
var util = require('util');

var _ = require('underscore');

var settings = require('../../settings');
var utils = require('../../utils');

var api_config = settings.apis.github;

var github_request = utils.make_class({
	init: function(username, password, repo, method){
		var self = this;
		self.method = method;
		// TODO: safify
		self.path = util.format("/repos/%s/%s/hooks", api_config.org, repo);
		self.headers = {
			'Authorization': utils.create_basic_auth(username, password)
		};
	},
	host: "api.github.com"
});

exports.install = function(){
	async.waterfall([
		get_hooks,
		parse_hooks_list,
		add_hooks,
		parse_hooks_response
		], function(err, result){
			console.log('finished chain\nerr: ', err, result);
	});
};

var get_hooks = function(callback){
	var list_hooks = {};

	_.each(api_config.repos, function(repo){
		var options = new github_request(api_config.username, api_config.password, repo, "GET");
		list_hooks[repo] = function(cb){
			utils.request_maker(options, cb);
		};
	});
	async.parallel(list_hooks, callback);
};

var parse_hooks_list = function(results, callback){
	var hooks_to_create = [];

	_.each(results, function(result, repo){
		var data = JSON.parse(result.data);
		var create_hook = false;
		if (result.res.statusCode === 404){
			return callback(new Error('Your config is probably wrong for github repos- they don\'t know it exists?'));
		}
		create_hook = (data.name !== "web" ||
			data.config.url !== ("http://108.171.188.131:3000/api/github/" + repo) ||
			_.indexOf(data.events, "pull_request") === -1
		);

		if (create_hook){
			hooks_to_create.push(repo);
		}
	});
	callback(null, hooks_to_create);
};

var add_hooks = function(hooks_to_create, callback){
	var create_hooks = {};

	_.each(hooks_to_create, function(repo){
		options = github_request(api_config.username, api_config.password, repo, "POST");
		options.headers['Content-Type'] = 'application/json';
		options.post_data = {
			name: "web",
			active: true,
			events: ["pull_request"],
			config: {
				url: "http://108.171.188.131:3000/api/github/" + repo,
				content_type: "json"
			}
		};
		create_hooks[repo] = function(cb){
			utils.request_maker(options, cb);
		};

	});

	async.parallel(create_hooks, callback);
};

var parse_hooks_response = function(results, callback){
	var created_repos = {};

	_.each(results, function(result, repo){
		var data = JSON.parse(result.data);
		created_repos[repo] = data;
	});
	callback(null, created_repos);
};