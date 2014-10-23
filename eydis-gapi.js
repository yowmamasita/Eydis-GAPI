angular.module('eydis.gapi', []).
provider('$gapi', function(){
  'use strict';

  this.client_id = null;
  this.scopes = ['email', 'profile'];
  this.api_base = null;

  var provider = this;

  this.$get = function($window, $http, $q, $log, $interval){
    var loaded_q = $q.defer();
    var ready_q = $q.defer();
    var authed_q = $q.defer();
    var userinfo = null;
    var wrapped_clients = {};
    var loading_clients = {};

    /* Stage2 is called after gapi bootstraps itself and initiates the load of the oauth2 library */
    $window._gapi_stage2 = function(){
      $window.gapi.client.load('oauth2', 'v2', function(){
        /* Try to go ahead and sign the user in */
        signin(true);
      });
    };

    /*
      Performs OAuth2 sign-in.
      If mode is set to true, then it executes a background (immediate) auth.
      If mode is set to false, then it execute a foreground auth.
    */
    var signin = function(mode){
      var q = $q.defer();

      /* Important stuff that google expects (configured via the provider) */
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

    /*
      Refreshes the authentication token.
    */
    var refresh_auth_token = function(){
      var d = $q.defer();
      $log.info('Refreshing Google auth token');
      $window.gapi.auth.authorize(
        {client_id: provider.client_id, scope: provider.scopes, immediate: true},
        function(auth_result){
          if(!auth_result.error){
            $log.info('successfully refreshed auth token.');
            d.resolve();
          } else {
            $log.error('failed to refresh auth token!');
            d.reject();
          }
        }
      );
      return d.promise;
    };

    // refresh the token every 45 minutes
    $interval(refresh_auth_token, 45 * 60 * 1000);

    /*
      Gets the user's profile information (email, name, etc.)
    */
    var get_user_info = function(){
      var q = $q.defer();

      // If we've already got their info, return it.
      if(userinfo){
        q.resolve(userinfo);
      }

      // Otherwise make the request.
      else {
        $window.gapi.client.oauth2.userinfo.get().execute(function(resp) {
          if (!resp.code) {
            userinfo = resp;
            q.resolve(userinfo);
          } else {
            q.reject();
          }
        });
      }
      return q.promise;
    };

    /* Wrapper to load a discovery-based api */
    var load = function(name, version, custom_api_base){
      var q = $q.defer();
      var api_base = null;

      if(custom_api_base === true) api_base = provider.api_base;
      else if(custom_api_base) api_base = custom_api_base;

      /* If already loading */
      if(loading_clients[name]){
        return loading_clients[name];
      }

      loading_clients[name] = q.promise;

      /* When GAPI is ready */
      loaded_q.promise.then(function(){
        /* If already loaded */
        if($window.gapi.client[name]){
          q.resolve(wrapped_clients[name]);
        }
        /* Load new library */
        else {
          $window.gapi.client.load(name, version, function(){
            if($window.gapi.client[name]){
              $log.info('Loaded google api: ' + name);
              wrapped_clients[name] = decorate($window.gapi.client[name]);
              q.resolve(wrapped_clients[name]);
            } else {
              q.reject();
            }
          }, api_base);
        }
      });
      return q.promise;
    };


    /* Wraps Google API methods into promisable items */
    var decorate = function(item){
      /* If it's an object, recurse */
      if (typeof(item) === 'object'){
        var result = {};
        for(var key in item){
          result[key] = decorate(item[key]);
        }
        return result;
      }
      /* If it's a function, wrap it to return a promise instead of an .execute()able function */
      else if(typeof(item === 'function')){
        return function(){
          var top_q = $q.defer();
          var that = this;
          var method_args = arguments;

          /* Execute the method and wrap its results in a promise */
          var execute = function(){
            var q = $q.defer();
            item.apply(that, method_args).execute(function(resp, raw){
              if(!resp.error){
                q.resolve(resp, raw);
              } else {
                q.reject(resp, raw);
              }
            });
            return q.promise;
          };

          execute(arguments).then(top_q.resolve, function(resp, raw){
            if(resp.error.code === 401){
              $log.info('Refreshing due to a 401');
              refresh_auth_token().then(function(){
                execute().then(top_q.resolve, top_q.reject);
              }, function(){
                top_q.reject(resp, raw);
              });

            } else {
              top_q.reject(resp, raw);
            }
          });

          return top_q.promise;
        };
      }
      /* Otherwise, pass through */
      else {
        return item;
      }
    };

    return {
      /* Loader ready */
      loaded: loaded_q.promise,
      /* User has authenticated promise */
      authed: authed_q.promise,
      /* User is authenicate and gapi is completely ready */
      ready: ready_q.promise,

      /* Load a google api */
      load: load,

      /* Prompt the user to sign in */
      signin: signin,

      /* Get the user info */
      get_user_info: get_user_info,

      /* Get gapi.client */
      client: wrapped_clients,

      /* Get raw gapi */
      get gapi() { return $window.gapi.client; },

      /* Return a gapi request as a promise */
      promise: function(r){
        var q = $q.defer();
        r.execute(function(resp, raw){
          if (!resp.code) {
            q.resolve(resp, raw);
          } else {
            q.reject(resp, raw);
          }
        });
        return q.promise;
      }
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
        window.setTimeout(call_loop);
      }
    };
    call_loop();
  }

  window['_gapi_load_callback'] = _gapi_load_callback;
})(window, document);
