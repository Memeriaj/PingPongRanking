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
	};
}]);