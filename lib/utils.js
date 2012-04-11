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
var https = require('https');
var querystring = require('querystring');

var settings = require('./settings');

var _ = require('underscore');

/**
 * makeClass - By John Resig (MIT Licensed)
 * Takes a function and ensures that new is called so that __this__ is properly bound
 * @param {proto} optional prototype to set on the returned function
 */
exports.make_class = function(proto){
  var f = function(args){
    // did you make me with new?
    if (this instanceof arguments.callee){
      // am I a function?
      if (typeof this.init === "function"){
        //PREGUNTA: why not always pass apply arguments?
        if (args){
          return this.init.apply(this, args.callee ? args : arguments );
        }
        else{
          return this.init.apply(this, arguments);
        }
      }
    } else{
      // didn't use new, return a properly instantiated object
      return new arguments.callee(arguments);
    }
  };
  if (proto){
    f.prototype = proto;
  }
  return f;
};



/**
 * Takes a username and password and returns a basic auth token fully formed
 *
 */
exports.create_basic_auth = function(username, password){
  var auth_token = new Buffer(username + ':' + password).toString('base64');
  return "Basic " + auth_token;
};
/**
 * Takes middlware function pointer with arrity of 5 and returns a middleware
 *
 * @param {string} name the name of the middleware (should be unique)
 * @param {fn} the middleware proper which should accept (req, res, next, payload, api_config- set payload.data/errors to cache stuff, api_config = req.devops[name]
 * @return {fn} middleware function
 */
exports.create_middleware = function(name, middleware){
  return function(req, res, next){
    // Do they have the api defined in the devops ball?
    if (!req.devops.related_apis || !req.devops.related_apis[name]) {
      req.devops[name] = null;
      next();
      return;
    }
      var payload = {error: null, data: null};
      req.devops[name] = payload;
      try{
        middleware(req, res, next, payload, req.devops.related_apis[name]);
      }catch (e){
        payload.error = e;
        // TODO: this may not be callable if the error was with express
        next();
      }
  };
};

/** A convenience function for making requests without having to build up response body data.
 * Also useful for mocking the making of requests in tests
 * @param {Object} options an options dict such as http.request would use
 * @param {fn} on_success callback that takes the complete response body data as a parameter
 * @param {fn} on_error callback that takes an Exception as a parameter
 */
exports.request_maker = function(options, call_back) {
  var post_data = "";
  var headers = {};
  if ( options.post_data !== undefined ){
    post_data = JSON.stringify(options.post_data);
    delete options.post_data;
  }

  headers['Content-length'] = post_data.length;

  if (options.headers){
    _.extend(options.headers, headers);
  }else{
    options.headers = headers;
  }

  var req = https.request(options, function(res) {
    var data = '';
    res.setEncoding('utf8');
    res.on('data', function(d) {
      data += d;
    });
    res.on('end', function() {
      try{
        call_back(null, {data: data, res: res});
      }catch(e){
        call_back(e, {data: data, res: res});
      }
    });
  });
  req.on('error', function(e) {
    call_back(e, null);
  });

  if (post_data){
    req.write(post_data);
  }
  req.end();
};

