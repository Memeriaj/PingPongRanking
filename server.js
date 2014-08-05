var sqlite3 = require('sqlite3').verbose();
var fs = require('fs');
var path = require('path');
var databaseCalls = require('./database/calls.js');

var databaseFile = 'database/pingPong.db';
var exists = fs.existsSync(databaseFile);

var db = new sqlite3.Database(databaseFile);
databaseCalls.setDatabase(db);

db.serialize(function(){
	if(!exists){
		databaseCalls.createDatabase();
		databaseCalls.importPeople(require('./database/names.json'));

		setTimeout(function(){
			databaseCalls.importGames(require('./database/games.json'));
		}, 1000);
	}

});

// SELECT * FROM users LEFT JOIN elo ON users.currentELO = elo.id

// SELECT users.firstName, users.lastName, elo.ranking 
// FROM users 
// LEFT JOIN elo 
// 	ON users.currentELO = elo.id
// ORDER BY elo.ranking



var express = require('express');
var app = express();

var apiRouter = express.Router();
apiRouter.get('/', function(req, res){
	res.json({message: 'hooray! welcome to our api!'});
});
apiRouter.get('/users', function(req, res){
	db.all('SELECT * FROM users LEFT JOIN elo ON users.currentELO = elo.id ORDER BY elo.ranking', 
		function(err, rows){
		res.json(rows);
	});
});
apiRouter.route('/users').post(function(req, res){
	var name = req.query;
	databaseCalls.addPerson(name.firstName, name.lastName);
	setTimeout(function(){res.json({updated: true});}, 1000);
});
apiRouter.route('/playedGame').post(function(req, res){
	var game = req.query;
	// console.log(game);
	databaseCalls.playedGame(game.firstId, game.secondId, 
		parseInt(game.firstScore, 10), parseInt(game.secondScore, 10));
	setTimeout(function(){res.json({updated: true});}, 1000);
});
apiRouter.route('/exportUsers').get(function(req, res){
	db.all('SELECT firstName, lastName from Users', function(err, rows){
		res.json(rows);
	});
});
apiRouter.route('/exportGames').get(function(req, res){
	var sql = 	'SELECT u1.firstName AS winnerFirstName, u1.lastName AS winnerLastName, g.winningScore, '+
					'u2.firstName AS loserFirstName, u2.lastName AS loserLastName, g.losingScore '+
				'FROM games AS g '+
				'LEFT JOIN users AS u1 '+
					'ON g.winnerId = u1.id '+
				'LEFT JOIN users AS u2 '+
					'ON g.loserId = u2.id '+
				'ORDER BY g.timestamp';
	db.all(sql, function(err, rows){
		res.json(rows);
	});
});
app.use('/api', apiRouter);


app.use(express.static(__dirname));

app.listen(8080);
console.log('listening on 8080');