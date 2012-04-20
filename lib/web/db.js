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
var path = require('path');

var _ = require('underscore');
var async = require('async');

var settings = require('../settings');
var utils = require('../utils');

// a flat file db that stores events and the last poll time of v1
stats = utils.make_class({
	init: function(){
		var self = this;
		var stats_dir;
		var data;
		var raw_v1_info;

		self.__flushing = false;
		self.stats_path = path.join(__dirname, settings.stats_path);
		try{
			// try to find the stats dir
			stats_dir = fs.lstatSync(self.stats_path);
			// is the stats dir a dir?
			if (!stats_dir.isDirectory()){
				console.error('The stats dir isn\'t a dir!');
				process.exit(1);
			}
			// oh noes, better try to make it
		}catch(e){
			if (e.errno === 34){
				try{
					fs.mkdirSync(self.stats_path);
					// no way to recover from this
				}catch(e){
					console.error("failed to make the stats dir");
					process.exit(1);
				}
			}
		}
		self.now = new Date();
		self.__version_one_date = {};
		self._stats_file = self._get_stats_path(self.now);
		self._version_one_file = path.join(self.stats_path, 'version_one.js');
		try{
			data = fs.readFileSync(self._stats_file, 'utf8');
			self._data = JSON.parse(data);
			raw_v1_info = fs.readFileSync(self._version_one_file, 'utf8');
			self.__version_one_date = JSON.parse(raw_v1_info);
		}catch(e){
			console.log('couldn\'t load flat file data or it doesn\'t exist');
		}
	},
	set_previous_v1_poll_date: function(project, date){
		var self = this;
		self.__version_one_date[project] = date;
	},
	get_previous_v1_poll_date: function(project){
		var self = this;
		return self.__version_one_date[project];
	},
	add_event: function(event, project, skip_check){
		var self = this;
		var score;

		if(!event.user){
			return;
		}
		if (!skip_check){
			self.check_for_flush();
		}
		if (!_.has(self._data, project)){
			self._data[project] = {};
		}
		if (!_.has(self._data[project], event.user)){
			self._data[project][event.user] = 0;
		}
		score = self._get_event_score(event);
		console.log('adding to score ', score, ' for user ', event.user);
		self._data[project][event.user] += score;
	},
	add_multiple_events: function(events, project){
		var self = this;
		self.check_for_flush();
		_.each(events, function(event){
			self.add_event(event, project, true);
		});
	},
	check_for_flush: function(){
		var self = this;
		if (new Date().month !== self.now.month){
			self.flush();
		}
	},
	flush: function(){
		var self = this;
		if (!self.__flushing){
			self.__flushing = true;
		} else{
			return console.log('already flushing');
		}
		self._old_data = self._data;
		self._data = {};
		self.now = new Date();

		async.parallel([
			function(cb){
				fs.writeFile(self._stats_file, JSON.stringify(self._old_data), 'utf8', cb);
			}, function(cb){
				fs.writeFile(self._version_one_file, JSON.stringify(self.__version_one_date), 'utf8', cb);
			}],	function(err, results){
				self.__flushing = false;
				if (err){
					console.log(err);
				}
				self._stats_file = self._get_stats_path(self.now);
		});
	},
	_get_stats_path: function(now){
		var self = this;
		var file_path;
		var year = now.getUTCFullYear();
		var month = now.getUTCMonth();
		if (!year || !month){
			console.error('Give me a year and month!');
			process.exit(1);
		}
		file_path = path.join(self.stats_path, year.toString()+ '-' + month.toString()+ '.json');
		return file_path;
	},
	_get_event_score: function(event, story_points){
		return story_points * event.multiplier;
	},
	_data: {}
});

exports = module.exports = new stats();