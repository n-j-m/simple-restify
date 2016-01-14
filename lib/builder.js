"use strict";

//require the dependencies
var assign = require( "lodash/object/assign" );
var restify = require( "restify" );
var fs = require( "fs-extra" );
var appRoot = require("app-root-path").path;
var path = require("path");

var verbs = ["get", "post", "put", "delete"];


///////////////// HELPER METHODS ///////////////

function createServer( info ){

	var server = restify.createServer( {
				name: info.name,
				version: info.version
	});

	return server;
}

function includeRoutes( routesPath, server, config ){
	fs.walk(routesPath)
		.on("data", function (item) {
			if (item.stats.isFile()) {
				var routePath = item.path.substr(item.path.indexOf(routesPath) + routesPath.length);
				if (path.basename(routePath) === "index.js") {
					routePath = routePath.substr(0, routePath.length - "index.js".length);
				}
				else {
					routePath = path.basename(routePath, ".js");
				}
				routePath = routePath.replace(routesPath, "");
				routePath = routePath.replace(path.sep, "/");
				if (routePath[routePath.length - 1] === "/") {
					routePath = routePath.substr(0, routePath.length - 1);
				}
				var routes = require(
					item.path
				);

				verbs.forEach(function(verb) {
					if (routes[verb]) {
						var resourcePath = [config.endpointPrefix, routePath].join("");
						server[verb](
							resourcePath,
							routes[verb]
						);
					}
				});
			}
		});
}

////////////////////////////////////////////////

//Import configObject into the creation or use the default values
function ServerObject( configObject ) {

	this.info = {
		port : 8000,
		name : "Restify Server",
		version : "1.0.0",
		rootPath : appRoot,
		routesPath : path.join(appRoot, "routes"),
		logging : true,
		endpointPrefix: "/"
	}

	assign( this.info, configObject );

	//create the server
	this.server = createServer( this.info );
}

//configure the server, only called by this class
ServerObject.prototype._configServer = function(){

	this.server.use( restify.queryParser() );
	this.server.use( restify.bodyParser({ mapParams: false }));

	if( this.info.logging ) {

		this.server.pre( function (req, res, next) {
		  	req.log.info({req: req}, "START");
			return next();
		});

	}

	includeRoutes( this.info.routesPath, this.server, this.info );
}

//add functionality to the server
ServerObject.prototype.add = function( cb ){

	this.server = cb( this.server );
	return this;
}

//run the server
ServerObject.prototype.run = function( cb ) {

	//configure the server
	this._configServer();

	var server = this.server;

	var info = this.info;

	server.listen( info.port, cb);

	return server;
}

//create the object
function config( configObject ) {

	return new ServerObject(configObject);
}

module.exports = { config : config  }














