Eydis Gapi: Google API & Sign-in for Angular
============================================

This component provides two separate pieces of functionality:

 * Loading of the Google API client for JavaScript (gapi).
 * Google sign-in and authenication.


Installation
------------


Install by downloading or via bower:

    bower install --save https://bitbucket.org/cloudsherpas/eyd-s-gapi.git


Include the javascript files:


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


Listening for successful sign-in
--------------------------------

For authenticated APIs, you likely want to wait until the user has been authenticated before making any calls. You can do this using the ``authed`` promise:

    $gapi.authed.then(function(){
      ...
    });

Often, it's a good practice to use the ``authed`` promise instead of the ``loaded`` promise to actually load external APIs. This ensures no calls are made before the user can sign-in.


License & Contributions
-----------------------

This is open-source under the Apache License, version 2. See license.txt for more info.

Contributions in the form of documentation, bug reports, patches, etc. are warmly welcomed.
