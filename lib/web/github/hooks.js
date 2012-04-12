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

var util = require('util');

var async = require('async');
var _ = require('underscore');

var settings = require('../../settings');
var utils = require('../../utils');

var API_CONFIG = settings.apis.github;
var EVENTS = ["pull_request"];

var get_api_url = function(repo){
	return util.format("http://%s:%s/api/github/%s", settings.external_ipv4, settings.listen_port, repo);
};

var github_request = utils.make_class({
	init: function(repo, method, id){
		var self = this;
		self.method = method;
		// TODO: safify
		self.path = util.format("/repos/%s/%s/hooks", API_CONFIG.org, repo);
		if (id){
			self.path += '/' + id;
		}
		self.headers = {
			'Authorization': utils.create_basic_auth(API_CONFIG.username, API_CONFIG.password)
		};
	},
	host: "api.github.com"
});

exports.install = function(cb){
	async.waterfall([
		get_hooks,
		delete_hooks,
		add_hooks,
		parse_response
		], cb || console.log);
};

var get_hooks = function(callback){
	var list_hooks = {};

	_.each(API_CONFIG.repos, function(repo){
		var options = new github_request(repo, "GET");
		list_hooks[repo] = function(cb){
			utils.request_maker(options, cb);
		};
	});
	async.parallel(list_hooks, callback);
};

var delete_hooks = function(results, callback){
	var to_delete = [];

	_.each(results, function(result, repo){

		if (result.res.statusCode === 404){
			return callback(new Error('Your config is probably wrong for github repos- they don\'t know it exists?'));
		}
		_.each(JSON.parse(result.data), function(hook){
			var options;
		// iterate through the hooks list for a given org/repo
			if (hook.config.url === get_api_url(repo)){
				console.log("DELETEing hook: " + hook.url, " for url", hook.config.url);
				options = new github_request(repo, "DELETE", hook.id);
				to_delete.push(function(cb){
					utils.request_maker(options, cb);
				});
			}
		});
	});
	async.parallel(to_delete, callback);
};

var add_hooks = function(results, callback){
	_.each(results, function(result){
		if (result.res.statusCode !== 204){
			callback(new Error('Tried to delete a hook and got: '+ result.data));
		}
	});

	var create_hooks = {};
	_.each(API_CONFIG.repos, function(repo){
		options = github_request(repo, "POST");
		options.headers['Content-Type'] = 'application/json';
		options.post_data = {
			name: "web",
			active: true,
			events: EVENTS,
			config: {
				url: get_api_url(repo),
				content_type: "json"
			}
		};
		create_hooks[repo] = function(cb){
			utils.request_maker(options, cb);
		};

	});
	async.parallel(create_hooks, callback);
};

var parse_response = function(results, callback){
	var created_repos = {};

	_.each(results, function(result, repo){
		var data = JSON.parse(result.data);
		created_repos[repo] = data;
	});
	callback(null, created_repos);
};