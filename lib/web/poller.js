var settings = require('../settings');

var poll_results = {};

module.exports.poll_results = poll_results;

var poll_github = function(api_config){

};

var poll_version_one = function(api_config){

};

exports.start = function(){
	var api_settings = settings.apis;
	setInterval(poll_github, api_settings.github.poll_interval, api_settings.github);
	setInterval(poll_version_one, api_settings.version_one.poll_interval, api_settings.version_one);
};