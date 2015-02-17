var servicesModule = angular.module('servicesModule', []);

servicesModule.factory('filterService', function() {
  return {
    excludeOneNoise: function(excludedNoises, layerName) {
      var i = excludedNoises.indexOf(layerName)
      if (i == -1) {
        excludedNoises.push(layerName);
      } else {
        excludedNoises.splice(i, 1);
      }
    },
    excludeAllNoises: function(status) {
      if (status) {
        excludedNoises = [
          'transit',
          'dump',
          'fireStation',
          'college',
          'school',
          'policeStation',
          'hospital',
          'bar',
          'construction',
          'demolition',
          'noiseComplaints',
          'stadium',
          'freeway',
          'heliportOrAirport'
        ];
      } else {
        excludedNoises = [];
      }
      return excludedNoises;
    },
    showAllD3Elements: function(status) {
      var circles = angular.element(document.getElementsByTagName('circle'));
      if (status) {
        circles.removeClass('hide');
      } else {
        circles.addClass('hide');
      }
    },
    toggleSwitches: function(status) {
      var checkboxes = [];
      var wrapper = document.getElementsByClassName('map-options')[0];
      checkboxes = wrapper.getElementsByTagName('input');

      for (var i = 0; i < checkboxes.length; i++)  {
        checkboxes[i].checked = status;
      }

      var switches = document.getElementsByClassName('switch');
      for (var i = 0; i < switches.length; i++) {
        if (status) {
          angular.element(switches[i]).removeClass('switched-off');
        } else {
          angular.element(switches[i]).addClass('switched-off');
        }
      }
    }
  }
});

servicesModule.factory('locationService', ['$http', function($http) {
  return {
    newMarker: function(coordinates, scope) {
      // Clear Any Current Markers
      for (var i = 0; i < scope.markers.length; i++) {
        scope.markers[i].setMap(null);
      }
      scope.markers = [];

      // Create New Marker
      marker = new google.maps.Marker({
        position: coordinates,
        map: scope.map,
        zIndex: 100
      });
      scope.markers.push(marker);

      // Zoom To New Marker
      scope.map.setZoom(15);
      scope.map.panTo(marker.getPosition());

      // Add Popup
      this.scorePopup(coordinates, scope);
    },
    scorePopup: function(coordinates, scope) {
      var url = 'http://54.191.247.160/score?latitude=' + coordinates.lat + '&longitude=' + coordinates.lng

      $http.get(url).success(function(data) {
        // Clear Any Current Popups
        for (var i = 0; i < scope.popups.length; i++) {
          scope.popups[i].setMap(null);
        }
        scope.popups = [];

        // Create Score String
        var nearbyNoises = '';
        for (var noise in data.noises) {
          target_noise = data.noises[noise]
          nearbyNoises += '<p><span class="glyphicon glyphicon-' +
                          target_noise.icon +
                          ' score-icon"></span><strong>' +
                          target_noise.noise_type + '</strong>';

          if (target_noise.details != null) {
            nearbyNoises += '<ul>';
            for (var i = 0; i < target_noise.details.length; i++) {
              nearbyNoises += '<li>' + target_noise.details[i] + '</li>';
            }
            nearbyNoises += '</ul>';
          }
          nearbyNoises += '</p>';
        }

        var scoreType;
        if (data.score == 'A') {
          scoreType = 'good-score';
        } else if (data.score == 'F') {
          scoreType = 'bad-score';
        } else {
          scoreType = 'med-score';
        }

        var contentString = '<div id="content">' +
          '<div id="siteNotice">' +
          '</div>' +
          '<h1 id="firstHeading" class="firstHeading text-center">Location Score</h1>' +
          '<div id="bodyContent">' +
          '<h2 class="text-center ' +
          scoreType +
          '">' + data.score + '</h2>'+
          nearbyNoises +
          '</div>' +
          '</div>';

        // Create InfoWindow
        var infowindow = new google.maps.InfoWindow({
            content: contentString
        });
        scope.popups.push(infowindow);

        // Add InfoWindow to Marker
        infowindow.open(scope.map,marker);
      });
    }
  }
}]);

servicesModule.factory('newLayerService', function() {
  return {
    setupLayer: function(apiResponse, excludedNoiseTypes) {
      var noiseArray = [];

      for (var i = 0; i < apiResponse.length; i++) {
        var location = apiResponse[i];
        var latLon = new google.maps.LatLng(location.lat, location.lon);
        var type = location.noise_type;
        var adjustedWeight = location.decibel * 0.15

        if (excludedNoiseTypes.indexOf(type) == -1) {
          noiseArray.push({location: latLon, noiseType: type, weight: adjustedWeight});
        }
      }

      return noiseArray;
    },
    createLayer: function(points) {
      var layer = new google.maps.visualization.HeatmapLayer({
        data: points,
        maxIntensity: 30,
        zIndex: 95
      });

      return layer;
    },
    findRadius: function(map, radius) {
      // Get the zoom level the user is currently at; radius must start as num of px at closest range; 1ft = 6px
      var current_zoom = map.getZoom();

      // Find the difference between where they currently are and the closest range zoom
      var no_of_divide_times = 21 - current_zoom;

      // Divide by 2 for each new level of zoom
      if (no_of_divide_times > 0) {
        for (var i = 0; i < no_of_divide_times; i++) {
          radius = radius / 2;
        }
      }

      // Round to nearest whole number to make Google's API happy
      var newRadius = Math.round(radius);
      return newRadius;
    }
  }
});
