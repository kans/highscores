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

var express = require('express');

var _ = require('underscore');
var fs = require('fs');
var urls = require('./urls');
var url = require('url');
var db = require('./db');
var utils = require('../utils');
var settings = require('../settings');

exports.install = function(app){
	app.post(urls.PUSH_API, [express.bodyParser()], function(req, res){
		var e = req.body;
		//var org = e.repository.owner.login;
		var action = e.action;
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
		var options = {
			host: "api.github.com",
			path: url.parse(e.pull_request.url).path,
			method: "GET",
			headers: {
				'Authorization': utils.create_basic_auth(settings.apis.github.username, settings.apis.github.password)
			}
		};
		utils.request_maker(options, function(err, results){
			console.log(err, results.data);
		});
	});
};