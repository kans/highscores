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
var et = require('elementtree');
var sequelize = require('sequelize');

var settings = require('../../settings');
var utils = require('../../utils');
var db = require('../db');

var api_config = settings.apis.version_one;

exports.install = function(){
	//setInterval(poller, settings.apis.version_one.delay || 1000 * 60 * 10);
	db.VersionOne.get_last_query_date(function(date){
		var now = utils.now();
		poller(date, now);
		// TODO: update db with now
	});
};
var github_request = utils.make_class({
	init: function(repo, method){
		var self = this;
		self.method = method;
		// TODO: safify
		self.path = util.format("/repos/%s/%s/events?per_page=100", API_CONFIG.org, repo);
		self.headers = {
			'Authorization': utils.create_basic_auth(settings.apis.github.username, settings.apis.github.password)
		};
	},
	host: "api.github.com"
});

var poller = function(){

	var options = new github_request('reach', 'GET');
  async.waterfall([
		_.bind(utils.request_maker, {}, options),
		function(data, callback){
			var new_events = [];
			if (data.res.statusCode != 200){
				return console.log(data.data);
			}
			var etree = et.parse(data.data);
			if (!_.isEmpty(data.error)){
				return console.log("no data");
			}
			callback(null, data.data);
		}],
	// },function(data, callback){
	// 	var chainer = new sequelize.Utils.QueryChainer();
	// 	_.each(data, function(row){
	// 		chainer.add(db.Event.create({event: row[2], repo: "reach", createdAt: row[0]}));
	// 	});
	// 	chainer.run().success(callback).error(callback);
	// }],
	function(err, data){
		if (err){
			return console.log(err.stack);
		}
	});
};