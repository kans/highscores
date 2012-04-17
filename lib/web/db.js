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

var fs = require('fs');
var _ = require('underscore');
var path = require('path');

var settings = require('../settings');
var utils = require('../utils');

stats = utils.make_class({
	init: function(){
		var stats_dir;
		var data;
		var now;
		var self = this;
		var stats_path = path.join(__dirname, settings.stats_path);
		self.stats_path = stats_path;
		try{
			stats_dir = fs.lstatSync(stats_path);
			if (!stats_dir.isDirectory()){
				console.error('The stats dir isn\'t a dir!');
				process.exit(1);
			}
		}catch(e){
			if (e.errno === 34){
				try{
					fs.mkdirSync(stats_path);
				}catch(e){
					console.error("failed to make the stats dir");
					process.exit(1);
				}
			}
		}
		now = new Date();
		self._stats_file = self._get_stats_path(now.getUTCFullYear(), now.getUTCMonth());
		try{
			data = fs.readFileSync(self._stats_file, 'utf8');
			self._data = JSON.parse(data);
		}catch(e){}
	},
	set_previous_v1_poll_date: function(date){
		var self = this;
		self._data.__version_one_date = date;
	},
	get_previous_v1_poll_date: function(){
		var self = this;
		return self._data.__version_one_date;
	},
	add_event: function(event, repo){
		var self = this;
		if (!_.has(self._data, repo)){
			self._data[repo] = {};
		}
		if (!_.has(self._data[repo], event.user)){
			self._data[repo][event.user] = 0;
		}
		self._data[repo][event.user] += self._get_event_score(event);
	},
	_get_stats_path: function(year, month){
		if (!year || !month){
			console.error('Give me a year and month!');
			process.exit(1);
		}
		var self = this;

		var file_path = path.join(self.stats_path, year.toString()+ '-' + month.toString()+ '.json');
		return file_path;
	},
	_get_event_score: function(event){
		return event.status;
	},
	_flush: function(){
		var self = this;
		var last_v1_date = self.get_previous_v1_poll_date();
		fs.writeFile(self._stats_file, JSON.stringify(self._data), 'utf8', function(err, results){
			if (err){
				console.log(err);
				return;
			}
			self._data = {};
			self.set_previous_v1_poll_date(last_v1_date);
			//TODO: set next flush
		});
	},
	_data: {}
});

exports = module.exports = new stats();