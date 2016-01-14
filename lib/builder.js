'use strict';

//require the dependencies
var assign = require( 'lodash/object/assign' );
var restify = require( 'restify' );
var fs = require( 'fs' );
var appRoot = require("app-root-path").path;
var path = require("path");


///////////////// HELPER METHODS ///////////////

function createServer( info ){

	var server = restify.createServer( {
				name: info.name,
				version: info.version
	});

	return server;
}

function includeRoutes( routesPath, server, options ){

	var routes = fs.readdirSync( routesPath );
	for (var i = 0, l = routes.length; i < l; i++) {
		if (routes[i].substr(-3, 3) === ".js") {
			var routeInit = require(
				path.join(routesPath, routes[i].replace("./js", ""))
			);
			routeInit(server, options);
		}
	}
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
		routesOptions : {},
		logging : true
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
		  	req.log.info({req: req}, 'START');
			return next();
		});

	}

	includeRoutes( this.info.routesPath, this.server, this.info.routesOptions );
}

//specify the routeOptions
ServerObject.prototype.routesOptions = function( options ){

	this.info.routesOptions = options;
	return this;

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














