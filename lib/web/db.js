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
var db = new sequelize('db', '', '', {dialect: 'sqlite', storage: 'lib/web/highscores.sqlite'});

var Users = db.define('Users', {
	name: sequelize.STRING
});

var Epochs = db.define('Epochs', {
	start: sequelize.DATE,
	end: sequelize.DATE
});

var Aliases = db.define('Aliases', {
	alias: sequelize.STRING,
	source: sequelize.STRING
});
Aliases.hasOne(Users, {as: 'user'});


var Stats = db.define('Stats', {
	score: sequelize.INTEGER,
	repo: sequelize.STRING
});
Stats
	.hasOne(Users, {as: 'user'})
	.hasOne(Epochs, {as: 'epoch'});

Users.hasMany(Stats, {as: 'stats'});

db.sync().success(function(){

}).error(function(err){
	throw err;
});

exports = module.exports = db;