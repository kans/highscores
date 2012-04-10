var async = require('async');
var util = require('util');

var settings = require('../settings');
var utils = require('../utils');

var poll_results = {};

module.exports.poll_results = poll_results;

var poll_github = function(api_config){
	var self = this;
	var requests = {};
	_.each(api_config.repos, function(repo){
		var options = {
			url: util.format("https://api.github.com/repos/%s/%s/hooks", api_config.username, repo),
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': utils.create_basic_auth(api_config.username, api_config.apikey)
			}
		};
		requests[repo] = function(cb){
			utils.request_maker(options, cb);
		};
	});
	async.parallel(requests, function(err, results){
		console.log(err, results);
	});


};

var poll_version_one = function(api_config){

};


var get_github_hooks = function(api_config){

};

exports.start = function(){
	var api_settings = settings.apis;
	setInterval(poll_github, api_settings.github.poll_interval, api_settings.github);
	setInterval(poll_version_one, api_settings.version_one.poll_interval, api_settings.version_one);
};