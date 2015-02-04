var homeControllerModule = angular.module('homeControllerModule', []);

homeControllerModule.controller('homeController', ['$scope', '$http', 'layerService', 'locationService',
  function($scope, $http, layerService, locationService) {

    function initialize() {
      var mapOptions = {
        center: { lat: 47.6, lng: -122.35},
        zoom: 13,
        maxZoom: 17,
        minZoom: 10,
        zoomControlOptions: { style: 'small' },
        streetViewControl: false
      };

      // Create & Add Map
      $scope.map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);


      // Fetch Noises From API and Process Into Layers
      $http.get('http://localhost:3000/').success(function(data) {

        // Sort Data into Layer Arrays
        var layers = layerService.setupLayers(data);

        // Create Heatmap Layers from Layer Arrays
        for (var layer in layers){
          layerService.createLayer($scope, layer, layers);
        }

        // Toggle Layer Function
        $scope.toggleLayer = function(layerName) {
          layerName.setMap(layerName.getMap() ? null : $scope.map);
        }

        // Change Radius on Zoom
        google.maps.event.addListener($scope.map, 'zoom_changed', function() {
          // Loop Through Layers...
          for (var i in layers) {
            console.log(i);
            // Get New Radius...
            var newRadius = layerService.findRadius($scope.map, layers[i].radius);

            // And Set New Radius!
            $scope[layer].set('radius', newRadius);
          }
        });
      });
    }

    // Zoom Map to Searched Location
    var markers = [];

    // Zoom to Location Function
    $scope.findLocation = function() {
      var url = 'https://maps.googleapis.com/maps/api/geocode/json?address=' + $scope.locationSearch + ',+Seattle,+WA&key=AIzaSyCY7E9oBmlcDOJ4iBR1aL3PYp5feIpQ0KE';

      $http.get(url).success(function(data) {
        var coordinates = data.results[0].geometry.location;
        locationService.newMarker(coordinates, $scope, markers);
      });
    };

    // Zoom to Current Location
    $scope.currentLocation = function(){
      if(navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(position) {
          var coordinates = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          locationService.newMarker(coordinates, $scope, markers);
        });
      }
    };

    // initialize map
    google.maps.event.addDomListener(window, 'load', initialize());

  }]);
