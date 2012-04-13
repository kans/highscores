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

var settings = require('../settings');
var sequelize = require('sequelize');
var db = new sequelize('db', '', '', {dialect: 'sqlite', storage: 'lib/web/'+settings.sqlite_path});

var User = db.define('User', {
	name: sequelize.STRING
});

var Alias = db.define('Alias', {
	alias: sequelize.STRING,
	source: sequelize.STRING
});
Alias.hasOne(User, {as: 'user'});

var Score = db.define('Stat', {
	points: sequelize.INTEGER,
	repo: sequelize.STRING
});
Score.hasOne(User, {as: 'user'});

User.hasMany(Score, {as: 'scores'});

db.sync().error(function(err){
	throw err;
});

exports = module.exports = db;