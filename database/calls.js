var db = {};
var multiplier = 300;

exports.setDatabase = function(database){
	db = database;
};

exports.createDatabase = function(){
	var tableSchema = require('./tables.json');
	tableSchema.forEach(function(table){
		var columnDefs = table.columns.reduce(function(totalColumn, currentColumn, index, array){
			var constraints = currentColumn.constraints.reduce(
				function(totalConstraints, currentConstraint, index, array){
					return totalConstraints + ' ' + currentConstraint;
				}, '');
			var col = currentColumn.name + ' ' + currentColumn.type + ' ' + constraints;
			return totalColumn + col + ', ';
		}, '');
		columnDefs = columnDefs.substring(0,columnDefs.length-2);
		var sqlCreateTable = 'CREATE TABLE '+table.name+' ('+columnDefs+')';
		db.run(sqlCreateTable);
	});
};

var updatePersonELO = function(userId, elo){
	var newELOCallback = function(){
		return function(err){
			if(err){
				console.log(err);
			} else {
				db.run('UPDATE users SET currentELO = $elo WHERE id = $userId', 
					{$elo: this.lastID, $userId: userId}, function(row){
						// console.log('Finished user '+userId);
					});
			}
		}
	}
	db.run('INSERT INTO elo (ranking, userId, timestamp) VALUES ($elo, $userId, $timestamp)', 
		{$userId: userId, $elo: elo, $timestamp: (new Date()).getTime()}, 
		newELOCallback(userId));
};

exports.addPerson = function(fistName, lastName){
	db.run('INSERT INTO users (firstName, lastName, timestamp) VALUES ($firstName, $lastName, $timestamp)',
		{$firstName: fistName, $lastName: lastName, $timestamp: (new Date()).getTime()}, 
		function(err){
			if(err){
				console.log(err);
			} else {
				updatePersonELO(this.lastID, 1000);
			}
		}
	);
};

exports.importPeople = function(nameList){
	nameList.forEach(function(name){
		exports.addPerson(name.firstName, name.lastName);
	});
};

var sqlGetELO = 'SELECT ranking '+
				'FROM users AS u '+
				'LEFT JOIN elo AS e '+
					'ON u.currentELO = e.id '+
				'WHERE u.id = ?';

var gameUpdate = function(winner, loser){
	db.run('INSERT INTO games (winnerId, loserId, winningScore, losingScore, timestamp) '+
		'VALUES (?, ?, ?, ?, ?)', [winner.id, loser.id, winner.score, loser.score, (new Date()).getTime()]);
	var winExpected = 1/(1+Math.pow(10, (loser.rank - winner.rank)/400));
	var kVal = multiplier*(5+winner.score - loser.score) / (5+winner.score + loser.score);
	var change = kVal*(1 - winExpected);
	updatePersonELO(winner.id, winner.rank + change);
	updatePersonELO(loser.id, loser.rank -change);
};

exports.playedGame = function(firstId, secondId, firstScore, secondScore){
	db.get(sqlGetELO, firstId, function(err, row){
		var firstRanking = row.ranking;
		db.get(sqlGetELO, secondId, function(err, secondRow){
			var secondRanking = secondRow.ranking;
			var first = {id: firstId, rank: firstRanking, score: firstScore};
			var second = {id: secondId, rank: secondRanking, score: secondScore};
			if(firstScore > secondScore){
				gameUpdate(first, second);
			} else {
				gameUpdate(second, first);
			}
		});
	});
};



exports.importGames = function(games){
	var getUserId = function(name, func){
		db.get('SELECT id FROM users WHERE firstName = ? and lastName = ?', 
			[name.firstName, name.lastName], function(err, row){
				func(row.id);
		});

	};

	var wins = [];
	var adjustGames = function(game){
		getUserId(game.first.name, function(firstId){
			getUserId(game.second.name, function(secondId){
				wins.push({winner: firstId, loser: secondId, times: game.first.games});
				wins.push({winner: secondId, loser: firstId, times: game.second.games});
			});
		});
	};
	games.forEach(adjustGames);

	var organizeGames = function(wins){
		var gamesPlayed = [];
		wins.forEach(function(win){
			if(win.times < 1){
				return;
			}
			// console.log(win);
			var toAdd = {firstId: win.winner, secondId: win.loser, firstScore: 21, secondScore: 16};

			var amount = win.times / (gamesPlayed.length+1);
			var current = amount + .01;
			for(var q=gamesPlayed.length; q > -1; q--){
				while(current >= 1){
					gamesPlayed.splice(q, 0, toAdd);
					current--;
				}
				current+= amount;
			}
			// if(win.winner == 10){
			// 	console.log(gamesPlayed);
			// }
		});
		// console.log(gamesPlayed);
		return gamesPlayed;
	};
	setTimeout(function(){
		wins.sort(function(a, b){
			return a.times - b.times;
		});
		// console.log(wins);
		// return;
		var gamesToAdd = organizeGames(wins);
		// console.log(gamesToAdd);
		var addGames = function(games, index){
			if(index < games.length){
				// console.log('adding game '+index)
				var curGame = games[index];
				// if(curGame.firstId == 10){
				// 	console.log('!!!!!!!!!');
				// }
				console.log(curGame);
				exports.playedGame(curGame.firstId, curGame.secondId, curGame.firstScore, curGame.secondScore);
				setTimeout(function(){addGames(games, index+1);}, 50);
			}
		};
		addGames(gamesToAdd, 0);
	}, 1000);
};



