var async = require('async');
var util = require('util');

var _ = require('underscore');

var settings = require('../settings');
var utils = require('../utils');

var api_config = settings.apis.github;

var poll_results = {};
module.exports.poll_results = poll_results;

var github_request = utils.make_class({
	init: function(username, password, repo, method){
		var self = this;
		self.method = method;
		self.path = util.format("/repos/racker/%s/hooks", repo);
		self.headers = {
			'Authorization': utils.create_basic_auth(username, password)
		};
	},
	host: "api.github.com"
});

var poll_github = function(){
	var create_hooks = {};

	get_github_hooks(function(err, results){
		if (err){
				console.log(err);
			}
		_.each(results, function(result, repo){
			var should_create_hook = false;
			var data, options;
			if (result.res.statusCode === 404){
				throw('Your config is probably wrong for github repos- they don\'t know it exists?');
			}
			data = JSON.parse(result.data);
			if(data.name == "web"){
				console.log(data);
			}
			options = github_request(api_config.username, api_config.password, repo, "POST");
			options.headers['Content-Type'] = 'application/json';
			options.post_data = {
				name: "web",
				active: true,
				events: ["pull_request"],
				config: {
					url: "http://108.171.188.131:3000/api/github/",
					content_type: "json"
				}
			};
			create_hooks[repo] = function(cb){
				utils.request_maker(options, cb);
			};

		});

		async.parallel(create_hooks, function(err, results){
			console.log(err, results);
		});

	});
};

var get_github_hooks = function(next){
	var list_hooks = {};

	_.each(api_config.repos, function(repo){
		var options = new github_request(api_config.username, api_config.password, repo, "GET");
		list_hooks[repo] = function(cb){
			utils.request_maker(options, cb);
		};
	});

	async.parallel(list_hooks, next);
};

var poll_version_one = function(api_config){

};


exports.start = function(){
	// setInterval(poll_github, api_settings.github.poll_interval, api_settings.github);
	poll_github();
	// setInterval(poll_version_one, api_settings.version_one.poll_interval, api_settings.version_one);
};