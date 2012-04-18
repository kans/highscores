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
var path = require('path');
var fs = require('fs');

var async = require('async');
var _ = require('underscore');

var settings = require('../../settings');
var utils = require('../../utils');

var EVENTS = ["pull_request"];

var API_CONFIG = settings.apis.github;
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
		], cb || _.bind(console.log, console, "Git add hooks response: "));
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
	var to_keep = [];
	_.each(results, function(result, repo){
		if (result.res.statusCode === 401){
			return callback(new Error('Your config is probably wrong for github- they don\'t like your creds.'+JSON.stringify(result.data)));
		}else if (result.res.statusCode === 404){
			return callback(new Error('Your config is probably wrong for github repos- they don\'t know it exists?'));
		}
		// iterate through the hooks list for a given org/repo
		_.each(JSON.parse(result.data), function(hook){
			var options;
			var delete_hook = true;
			if (hook.message){
				return callback(new Error('Error: github says -> ' + hook.message));
			}
			if (hook.config.url === get_api_url(repo)){
				if (_.indexOf(to_keep, hook.config.url) !== -1){
					console.log("DELETEing hook: " + hook.url, " because its a dup");
				}	else if (hook.active !== true){
					console.log("DELETEing hook: " + hook.url, " because its not active");
				} else if (hook.name !== 'web'){
					console.log("DELETEing hook: " + hook.url, " because its not named 'web'");
				} else if(_.indexOf(hook.events, 'pull_request') === -1){
					console.log("DELETEing hook: " + hook.url, " because its not listening to pull_requests");
				} else if(hook.last_response.status !== "unused" && hook.last_response.status !== "ok"){
					console.log("DELETEing hook: " + hook.url, " because its " + hook.last_response.status);
				} else{
					delete_hook = false;
				}
				if (!delete_hook){
					console.log("\n\nKEEPing hook: " + JSON.stringify(hook)+'\n\n');
					to_keep.push(hook.config.url);
				}else{
					options = new github_request(repo, "DELETE", hook.id);
					to_delete.push(function(cb){
						utils.request_maker(options, cb);
					});
				}
			}
		});
	});
	async.parallel(to_delete, function(err, results){
		callback(err, results, to_keep);
	});
};

var add_hooks = function(results, existing_hooks, callback){
	var create_hooks = {};
	var i, repo, url;
	_.each(results, function(result){
		if (result.res.statusCode !== 204){
			callback(new Error('Tried to delete a hook and got: '+ result.data));
		}
	});
	for (i=0; i<API_CONFIG.repos.length; i++){

		repo = API_CONFIG.repos[i];
		url = get_api_url(repo);
		if (_.indexOf(existing_hooks, url) !== -1){
			continue;
		}
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
		create_hooks[repo] = _.bind(utils.request_maker, utils, options);
	}
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