(function(){
	'user-strict'

	var express = require('express');
	var app = express();
	var bodyParser = require('body-parser');
	var compress = require('compression');
	var cors = require('cors');
	var logger = require('morgan');
	var port = process.env.PORT || 8082;
	var showtimes = require('showtimes');
	var apicache = require('apicache').options({debug: true}).middleware;
	var _ = require('underscore');
	//var googleMap = require('./google_map_api');
	var routes;

	app.use(bodyParser.urlencoded({extend: true}));
	app.use(bodyParser.json());
	app.use(compress());
	app.use(cors());
	app.use(logger('dev'));

	console.log("about to launch server");

	function fetchShowTimes(req, res){
		var lat = req.params.lat;
		var long = req.params.long;
		var mMovie = req.params.movie;
		var api = new showtimes([lat, long], {});
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
		res.send('pong');
	});

	app.get('/showtimes/:lat/:long/:movie', apicache('10 hours'), fetchShowTimes);

	app.use(cors());

	app.listen(port, function(){
		console.log("server listening on port: "+port);
	});
})()