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

		self.__flushing_data = false;
		self.__flushing_v1 = true;
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
		self._flush_version_one();
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
		score = event.get_points();
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
		var now = new Date();
		if (now.getUTCMonth() !== self.now.getUTCMonth()){
			self._flush_data();
		}
	},
	_flush_data: function(){
		var self = this;
		console.log('flushing data');
		if (!self.__flushing_data){
			self.__flushing_data = true;
		} else{
			return console.log('already flushing');
		}
		self._old_data = self._data;
		self._data = {};
		self.now = new Date();
		console.log("now", self.now);

		fs.writeFile(self._stats_file, JSON.stringify(self._old_data), 'utf8', function(err, results){
			self.__flushing_data = false;
			if (err){
				console.log(err);
			}
			self._stats_file = self._get_stats_path(self.now);
		});
	},
	_flush_version_one: function(){
		var self = this;
		if (!self.__flushing_v1){
			self.__flushing_v1 = true;
			fs.writeFile(self._version_one_file, JSON.stringify(self.__version_one_date),
				'utf8', function(err, results){
					if (err){
						console.error(err);
					}
					self.__flushing_v1 = false;
				});
		}
	},
	get_stats_for_project: function(project){
		var self = this;
		return self._data[project];
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
	_data: {}
});

exports = module.exports = new stats();