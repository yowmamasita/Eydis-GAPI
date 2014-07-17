Eydis Gapi: Google API & Sign-in for Angular
============================================

This component provides two separate pieces of functionality:

 * Loading of the Google API client for JavaScript (gapi).
 * Google sign-in and authenication.


Installation
------------

Install via bower or by downloading and adding to you app. Include the javascript files:


    <script src="bower_components/eydis-gapi/eydis-gapi-signin.js"></script>
    <script src="bower_components/eydis-gapi/eydis-gapi.js"></script>


Configuration
-------------

Before you can use you must use the ``$gapiProvider`` to configure your oauth settings. Usually this is done in your main app module.

    angular.module('EydisApp', ['eydis.gapi'],])
    .config(function($gapiProvider){
      // Web Client ID from the developer console.
      $gapiProvider.client_id = '462711127220-1mr3uha1ukgicv4s0ebvo26bulkpb4k1.apps.googleusercontent.com';

      // If you need more than just the user's basic info, add additional scope, otherwise you can leave this out.
      $gapiProvider.scopes = [
        "https://www.googleapis.com/auth/userinfo.email",
        "https://www.googleapis.com/auth/drive"
      ];

      // If you're loading custom Google Cloud Endpoints APIs, you'll need to use this.
      $gapiProvider.api_base = 'https://api-dot-myapp.appspot.com/_ah/api';
    });



Gapi Loader
-----------

To enable the gapi loader add the following to your html:

    <!-- Google API Loader -->
    <script src="https://apis.google.com/js/client.js?onload=_gapi_load_callback"></script>

Be sure to put this *after* you include ``eydis-gapi.js``

Gapi will be loaded automatically. To listen to the "finished loading" event and load additional APIs use:

    controller('Example', function($scope, $gapi){
      $gapi.loaded.then(function(){
        $gapi.load('maps', 'v3').then(function(){
          $gapi.client().maps...;
        });
      });
    });

Notice the use of ``$gapi.client().api`` instead of the usual ``$gapi.client.api``.


Sign-in
-------

There's a built-in sign in button directive that can handle everything for you. Add the ``eydis.gapi.signin`` to your application and you can use it via:
    
    <gapi-sign-in ready="ready"></gapi-sign-in>

    <!-- hide the app until the user is signed in -->
    <div ng-view ng-show="ready">

This expects bootstrap and font-awesome to be around and that an image at ``/images/loading.gif`` exists. Though of course you can style it yourself.

You can also trigger authentication yourself. See the source to the sign-in directive for information on doing this yourself.
