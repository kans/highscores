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
// DON'T REMOVE ME
require('sqlite3');
var sequelize = require('sequelize');
var db = new sequelize('db', '', '', {dialect: 'sqlite',storage: '/home/kans/highscores/lib/web/db.sqlite'});

var User = db.define('User', {
	name: sequelize.STRING
});

var Epoch = db.define('Epoch', {
	start: sequelize.DATE,
	end: sequelize.DATE
});

var Alias = db.define('Alias', {
	alias: sequelize.STRING,
	source: sequelize.STRING
});
Alias.hasOne(User, {as: 'user'});


var Stat = db.define('Stat', {
	score: sequelize.INTEGER,
	repo: sequelize.STRING
});
Stat
	.hasOne(User, {as: 'user'})
	.hasOne(Epoch, {as: 'epoch'});

User.hasMany(Stat, {as: 'stats'});

db.sync();

exports = module.exports = db;