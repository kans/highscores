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

var settings = require('../../settings');
var utils = require('../../utils');
var db = require('../db');
var Event = require('../events');

var API_CONFIG = settings.apis.version_one;

var selection = ["ChangedBy",
                "CreateDate",
                "Owners",
                "AssetState",
                "AssetType",
                "Priority"];

function parse(data, callback){
	var new_events = [];
	if (data.res.statusCode != 200){
		return console.log(data.data);
	}
	var etree = et.parse(data.data);
	if (!_.isEmpty(data.error)){
		return console.log("no data");
	}

	assets = etree.getroot().findall('./Asset');
	_.each (assets, function(asset) {
		var create_date, user, status;
		_.each(asset._children, function(child){
			var name = child.attrib.name;
			switch(name){
				case "CreateDate":
					create_date = (new Date(child.text)).valueOf();
					break;
				case "ChangedBy.Nickname":
					user = child.text;
					break;
				case "AssetState":
					status = child.text;
					break;
			}
		});
		new_events.push(Event(user, null, status, create_date));
	});
	callback(null, new_events);
}

function _store(repo, events, callback){
	console.log(events);
	db.add_multiple_events(events, repo);
	callback();
}

var poller = function(start_time, end_time){
	var options, request, path;
	end_time = end_time || new Date().toISOString();
	path = ['/',
		API_CONFIG.name,
		"/rest-1.v1/Data/Defect?sel=",
		selection,
		"&where=AssetState='64','128';Scope='Scope:",
		API_CONFIG.project,
		"';CreateDate<'",
		end_time,
		"'"];

	if (start_time){
		path.push(";CreateDate>='");
		path.push(start_time);
		path.push("'");
	}

  options = {
    port: API_CONFIG.port,
    host: API_CONFIG.host,
    path: encodeURI(path.join("")),
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Basic ' + new Buffer(API_CONFIG.auth).toString('base64')
    }
  };

  // bind options so the request maker just takes the cb from async
  request = _.bind(utils.request_maker, {}, options);
  // bind the project :(
  store = _.bind(_store, {}, API_CONFIG.project);

  async.waterfall([
		request,
		parse,
		store],
		function(err, data){
			setTimeout(poller, 1000*60*10, end_time);
			if(err){
				console.error(err);
				return;
			}
			db.set_previous_v1_poll_date(end_time);
			db.flush();
		});
};

exports.install = function(){
	var now = new Date().toISOString();
	var date = db.get_previous_v1_poll_date();
	poller(date, now);
};
