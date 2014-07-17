'use strict';


angular.module('eydis.gapi', []).
provider('$gapi', function(){

  this.client_id = null;
  this.scopes = 'https://www.googleapis.com/auth/userinfo.email';
  this.api_base = null;

  var provider = this;

  this.$get = function($window, $http, $q){
    var loaded_q = $q.defer();
    var ready_q = $q.defer();
    var authed_q = $q.defer();
    var userinfo = null;

    $window._gapi_stage2 = function(){
      $window.gapi.client.load('oauth2', 'v2', function(){
        signin(true);
      });
    };

    var signin = function(mode){
      var q = $q.defer();
      var conf = {
        client_id: provider.client_id,
        scope: provider.scopes,
        immediate: mode
      };
      $window.gapi.auth.authorize(conf,
        function(auth_result){
          if(!auth_result.error){
            loaded_q.resolve(true);
            /* Auth successful, get user info */
            get_user_info().then(function(userinfo){
              ready_q.resolve();
              authed_q.resolve(userinfo);
              q.resolve(userinfo);
            });
          } else {
            loaded_q.resolve(false);
          }
      });
      return q.promise;
    };


    var get_user_info = function(){
      var q = $q.defer();
      if(userinfo){
        q.resolve(userinfo);
      } else {
        $window.gapi.client.oauth2.userinfo.get().execute(function(resp) {
          if (!resp.code) {
            userinfo = resp;
            q.resolve(userinfo);
          }
        });
      }
      return q.promise;
    };

    var load = function(name, version, api_base){
      var q = $q.defer();
      ready_q.promise.then(function(){
        authed_q.promise.then(function(){
          $window.gapi.client.load(name, version, function(){ q.resolve(); }, api_base || provider.api_base);
        });
      });
      return q.promise;
    };

    return {
      /* Loader ready */
      loaded: loaded_q.promise,
      /* User has authenticated promise */
      authed: authed_q.promise,
      /* User is authenicate and gapi is completely ready */
      ready: ready_q.promise,

      load: load,
      signin: signin,
      get_user_info: get_user_info,
      client: function(){ return $window.gapi.client; }
    };
  };
});

(function(window){
  /*jshint sub:true*/
  function _gapi_load_callback(){
    var call_loop = function(){
      if(window._gapi_stage2){
        window._gapi_stage2();
      } else {
        setTimeout(call_loop);
      }
    };
    call_loop();
  }

  window['_gapi_load_callback'] = _gapi_load_callback;
})(window, document);