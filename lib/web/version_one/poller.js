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
var request = require('request');

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

var selection = ["ChangedBy",
                "CreateDate",
                "Owners",
                "SecurityScope",
                "AssetState",
                "AssetType",
                "Timebox",
                "Resolution",
                "Scope",
                "Priority"];

var poller = function(start_time, end_time){

	path = ['/',
		api_config.name,
		"/rest-1.v1/Data/Defect?sel=",
		selection,
		"&where=AssetState='0','64';Scope='Scope:",
		api_config.project,
		"';CreateDate<'",
		end_time,
		"'"];

	if (start_time){
		path.push(";CreateDate>='");
		path.push(start_time);
		path.push("'");
	}

  var options = {
    port: api_config.port,
    host: api_config.host,
    path: encodeURI(path.join("")),
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Basic ' + new Buffer(api_config.auth).toString('base64')
    }
  };
  console.log(api_config.host + options.path);

  utils.request_maker(options,
    function(error, data){
			if (error){
				return console.log(error.stack);
			}
			if (data.res.statusCode != 200){
				return console.log(data.data);
			}
			var etree = et.parse(data.data);
			if (!_.isEmpty(data.error)){
				return console.log("no data");
			}
			assets = etree.getroot().findall('./Asset');
			_.each (assets, function(asset) {
				console.log(asset);
			});
  });
};