'use strict';

angular.module('eydis.gapi.signin', ['eydis.gapi']).
directive('gapiSignIn', function ($gapi) {
  return {
    restrict: 'EA',
    scope: {
      ready: '='
    },
    templateUrl: 'bower_components/eydis-gapi/eydis-gapi-signin.html',
    controller: function($scope){
      $scope.loaded = false;

      $gapi.authed.then(function(){
        $scope.ready = true;
      });

      $gapi.loaded.then(function(r){
        $scope.loaded = true;
        if(r) $scope.loaded_preauthed = true;
      });

      $scope.signin = $gapi.signin;
    }
  };
});
