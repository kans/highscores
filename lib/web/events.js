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

var utils = require('../utils');

var idjson = require('./idjson').load();

Event = utils.make_class({
	init: function(version_one, github, status, date){
		var self = this;
		self.status = status;
		self.date = date;

		if (github){
			self.user = github;
		} else if(version_one){
			self.user = idjson[version_one];
		} else{
			self.user = null;
		}
	}
});

module.exports = Event;