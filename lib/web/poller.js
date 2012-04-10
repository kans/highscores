var async = require('async');
var util = require('util');

var _ = require('underscore');

var settings = require('../settings');
var utils = require('../utils');

var poll_results = {};

module.exports.poll_results = poll_results;

var github_request = utils.make_class({
	init: function(username, password, repo, method){
		var self = this;
		self.method = method;
		self.path = util.format("/repos/%s/%s/hooks", username, repo);
		self.headers = {
			'Authorization': utils.create_basic_auth(username, password)
		};
	},
	host: "api.github.com"
});

var poll_github = function(api_config){
	var self = this;
	var requests = {};
	_.each(api_config.repos, function(repo){
		var options = new github_request(api_config.username, api_config.password, repo, "GET");
		requests[repo] = function(cb){
			utils.request_maker(options, cb);
		};
	});
	async.parallel(requests, function(err, results){
		console.log(results);
	});


};

var poll_version_one = function(api_config){

};


var get_github_hooks = function(api_config){

};

exports.start = function(){
	var api_settings = settings.apis;
	// setInterval(poll_github, api_settings.github.poll_interval, api_settings.github);
	poll_github(api_settings.github);
	// setInterval(poll_version_one, api_settings.version_one.poll_interval, api_settings.version_one);
};