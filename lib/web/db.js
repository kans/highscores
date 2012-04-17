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

var sequelize = require('sequelize');

var settings = require('../settings');
var utils = require('../utils');

var db = new sequelize('db', '', '',{
	dialect: 'sqlite',
	storage: 'lib/web/'+settings.sqlite_path
});

var Event = db.define('Event', {
	event: sequelize.STRING,
	repo: sequelize.STRING,
	user: sequelize.STRING
});

var VersionOne = db.define(
	'VersionOne', {
		query_date: { type: sequelize.DATE }
	},{
		classMethods: {
			get_last_query_date: function(cb){
				return VersionOne.max('query_date').success(cb);
		}
	}
});

db.Event = Event;
db.VersionOne = VersionOne;

db.install = function(cb){
	db.sync().error(function(err){
		throw err;
	}).success(cb);
};
exports = module.exports = db;

