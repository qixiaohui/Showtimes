(function(){
	'user-strict'

	var express = require('express');
	var rateLimit = require('express-rate-limit');
	var app = express();
	var bodyParser = require('body-parser');
	var compress = require('compression');
	var cors = require('cors');
	var logger = require('morgan');
	var port = process.env.PORT || 8082;
	var showtimes = require('showtimes');
	var apicache = require('apicache').options({debug: true}).middleware;
	var _ = require('underscore');
	var gps = require('gps2zip');
	//var googleMap = require('./google_map_api');
	var routes;

	app.use(bodyParser.urlencoded({extend: true}));
	app.use(bodyParser.json());
	app.use(compress());
	app.use(cors());
	app.use(logger('dev'));
	app.enable('trust proxy');

	var limitter = rateLimit({});
	app.use(limitter);

	console.log("about to launch server");

	function fetchShowTimes(req, res){
		var lat = req.params.lat;
		var long = req.params.long;
		var mMovie = req.params.movie;
		var zip = gps.gps2zip(lat, long);
		var days = req.params.days.toString();
		console.log(zip);
		var api = new showtimes(zip.zip_code, {date: days});
		//var geocoder = new googleMap.google.maps.Geocoder();
		api.getTheaters(function(err, theaters){
			if(err){
				console.error("can't get showtimes");
			}
			var result = [];
			_.each(theaters, function(theater){
				theater.movie = [];
				_.each(theater.movies, function(movie){
					if(movie.name.trim().toUpperCase().replace(/[^A-Z0-9]+/ig, "").indexOf(mMovie.trim().toUpperCase()) > -1){
						theater.movie.push(movie);
					}
				}.bind(this));
				if(theater.movie.length > 0){
					theater.movies = null;
					result.push(theater);
				}
			}.bind(this));
			res.send(result);
		});
	}

	app.get('/ping', function(req, res){
		var api = new showtimes(80221, {date:"1"});
		api.getTheaters(function(err, theaters){
			if(err){
				console.e("ping error");
			}
			res.send(theaters);
		});
	});

	app.get('/showtimes/:lat/:long/:movie/:days', fetchShowTimes);

	app.use(cors());

	app.listen(port, function(){
		console.log("server listening on port: "+port);
	});
})()