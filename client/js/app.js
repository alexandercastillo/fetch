
import 'angular';
import 'angular-material';
import 'angular-aria';
import 'angular-animate';

import 'firebase/lib/firebase-web';
import 'angularfire/dist/angularfire';

import '../lib/angular-facebook';

var JSZip = require('jszip');
var JSZipUtils = require('jszip-utils');

import { saveAs } from 'node-safe-filesaver';

var app = angular.module('fetch', ['firebase','facebook','ngMaterial','ngAria','ngAnimate']);

app.config(function(FacebookProvider) {
   FacebookProvider.init('393107454229174');
});

app.controller('AuthCtrl', ($scope, $rootScope, $firebaseAuth, Facebook) => {

  var ref = new Firebase('https://gempoof.firebaseio.com/');
  var auth = $firebaseAuth(ref);

  $scope.login = () => {
    auth.$authWithOAuthPopup('facebook', { scope: 'public_profile,email,user_photos' }).then((user) => {
      console.log('Logged in as:', user);
      $scope.user = user;
      $rootScope.$broadcast('$login', angular.extend({}, user));
    }).catch((error) => {
      console.log('Authentication failed:', error);
    });
  };

});

app.controller('PhotosCtrl', ($scope, $rootScope, $firebaseAuth, $q, Facebook) => {

  $scope.photos = [];

  $scope.setStep = (step) => {
    $scope.step = step;
  };

  $scope.isStep = (step) => {
    return $scope.step === step;
  };

  var getPhotos = (user, ) => {

    Facebook.api('me/photos/tagged?fields=source,picture,from,name&limit=100000', function (photos) {
      console.log('Facebook', photos);
      $scope.photos = $scope.selectPhotos(photos.data, true);
      $rootScope.$broadcast('$fetch');
    }, { 
      access_token: user.facebook.accessToken 
    });

  };
  
  $scope.selectPhotos = (photos, selection) => {
    angular.forEach(photos, function (photo) {
      photo.selected = selection;
    });
    return photos;
  };

  $scope.checkSelection = (selection) => {
    if (!selection) $scope.selectAll = false;
  };

  var zipPhotos = () => {

    var zip = new JSZip();
    var folder = zip.folder('photos');
    zip.file('README.md', 'Thank you for using this app.');

    var promises = [];

    var addZip = (url, filename, folder) => {
      var deferred = $q.defer();
      JSZipUtils.getBinaryContent(url, function (err, data) {
        if (!err) {
          folder.file(filename, data, { binary: true });
          deferred.resolve(data);
        } else {
          deferred.reject(err);
        }
      });
      return deferred.promise;
    };

    $scope.photos.forEach(function (photo) {
      if (photo.selected) {
        promises.push(
          addZip(photo.source, `${photo.id}.jpg`, folder)
        );
      }
    });

    $q.all(promises).then(function (data) {
      var blob = zip.generate({ type: 'blob' });
      saveAs(blob, 'MyTaggedPhotos.zip');
      $rootScope.$broadcast('$downloaded');
    });

  };

  $scope.download = () => {
    zipPhotos();
    $scope.setStep('downloading');
  };

  $rootScope.$on('$login', function (event, user) {
    $scope.setStep('fetching');
    getPhotos(user);
  });

  $rootScope.$on('$fetch', function (event, user) {
    $scope.setStep('fetched');
  });

  $rootScope.$on('$downloaded', function (event, user) {
    $scope.setStep('downloaded');
  });

});

