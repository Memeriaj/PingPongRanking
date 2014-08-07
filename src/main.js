var pingPongApp = angular.module('pingPongApp', []);

pingPongApp.controller('UserListCtrl', ['$scope', '$http', function($scope, $http){
	refreshUsers = function(){
		$http.get('/api/users').success(function(data){
			$scope.users = data;
		});
	};
	refreshUsers();

	$scope.predicate = 'ranking';

	$scope.addUser = function(){
		var postData = {
			firstName: $scope.addFirstName,
			lastName: $scope.addLastName
		};
		$http.post('/api/users', {}, {params: postData})
		.success(function(){
			refreshUsers();
		});
		$scope.addFirstName = '';
		$scope.addLastName = '';
	};

	$scope.playedGame = function(){

		var error;

		// Game Validations
		if (typeof $scope.playedFirst.userId === 'undefined' || typeof $scope.playedSecond.userId === 'undefined' ) {
			error = "Missing player entry.";
		} else if ($scope.playedFirst.userId == $scope.playedSecond.userId) {
			error = "You cannot play yourself.";
		} else if (typeof $scope.playedFirstScore === 'undefined' ||typeof $scope.playedSecondScore === 'undefined') {
			error = "Missing game score.";
		} else if ($scope.playedFirstScore < 21 && $scope.playedSecondScore < 21) {
			error = "Neither player reached a score of 21.";
		} else if (!(($scope.playedFirstScore - $scope.playedSecondScore >= 2) || ($scope.playedSecondScore - $scope.playedFirstScore >= 2))) {
			error = "Winner must win by at least 2 points.";
		};

		if (error.length == 0) {
			console.log("Passed errors");
			var postData = {
				firstId: $scope.playedFirst.userId,
				secondId: $scope.playedSecond.userId,
				firstScore: $scope.playedFirstScore,
				secondScore: $scope.playedSecondScore
			};

			$http.post('/api/playedGame', {}, {params: postData})
			.success(function(){
				refreshUsers();
			});
			$scope.playedFirst = {};
			$scope.playedSecond = {};
			$scope.playedFirstScore = '';
			$scope.playedSecondScore = '';
		}
		
	};
}]);