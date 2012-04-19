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
var express = require('express');

var _ = require('underscore');
var async = require('async');
var et = require('elementtree');

var urls = require('./urls');
var url = require('url');
var db = require('./db');
var utils = require('../utils');
var settings = require('../settings');

exports.install = function(app, devops){

	create_v1_options = function(id, repo, type){
		var options, path, v1_spec;

		v1_spec = devops[repo].version_one;

		path = ['/',
			v1_spec.name,
			"/rest-1.v1/Data/",
			type,
			util.format("?sel=Estimate&where=Number='%s-%s'", {'Story': "B", "Defect": "D"}[type], id)
		];

		options = {
			port: v1_spec.port,
			host: v1_spec.host,
			path: encodeURI(path.join("")),
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': 'Basic ' + new Buffer(v1_spec.auth).toString('base64')
			}
		};
		return options;
	};

	app.post(urls.PUSH_API, [express.bodyParser()], function(req, res){
		var github_spec, defect_options;
		var requests = {};
		var estimate = 1;
		var e = req.body;
		//var org = e.repository.owner.login;
		var action = e.action;
		var title = e.pull_request.title;
		var number_matches = title.match(/(\d{4,}){1}/);
		if (number_matches){
			var str_number = number_matches[0];
			// the number is between 4 and 6 digits
			if (str_number.length >= 4 && str_number.length <= 6){
				defect_options = create_v1_options(str_number, req.params.project, 'Defect');
				story_options = create_v1_options(str_number, req.params.project, 'Story');
				requests.Defect = _.bind(utils.request_maker, null, defect_options);
				requests.Story = _.bind(utils.request_maker, null, story_options);
				async.parallel(requests, function(err, results){
					console.log(err, results);
					if (!results){
						return;
					}
					_.each(results, function(data, type){
						var etree = et.parse(data.data);
						if (!_.isEmpty(data.error)){
							return console.log("no data");
						}
						assets = etree.getroot().findall('./Asset');
						_.each(assets, function(asset){
							try{
							new_estimate = parseInt(asset._children[0].text, 10);
							if (new_estimate > estimate){
								estimate = new_estimate;
							}
						} catch(e){}
							console.log(estimate);
						});
					});

				});
			}
		}
		switch(action){
			case "opened":
				// give pull_request.user points
				break;
			case "closed":
				if (e.pull_request.merged){
					// give pull_request.user points and e.pull_request.merged_by.login
				}else{
					// give pull_request.user points
				}
				break;
			case "synchronized":
				// give pull_request.user points
				break;
			case "reopened":
				// kill many points on someone?!?
				break;
		}
		// Unfortunately, git doesn't give us all the info we need in the event hook, so we need to go ask it :(
		console.log('\n'+e.sender.login, e.pull_request.user.login, e.pull_request.url);
		res.send('ok', 200);
		github_spec = devops[req.params.project].github;
		options = {
			host: "api.github.com",
			path: url.parse(e.pull_request.url).path,
			method: "GET",
			headers: {
				'Authorization': utils.create_basic_auth(github_spec.username, github_spec.apikey)
			}
		};
		// utils.request_maker(options, function(err, results){
		// 	console.log(err, results.data);
		// });
	});
};