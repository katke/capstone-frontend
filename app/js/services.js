var servicesModule = angular.module('servicesModule', []);

servicesModule.factory('layerService', function() {
  return {
    setupLayers: function(apiResponse) {
      var layers = {
        fireStations: [],
        colleges: [],
        schools: [],
        hospitals: [],
        bars: [],
        policeStations: [],
        transit: [],
        dumps: []
      };

      for (var i = 0; i < apiResponse.length; i++) {
        var location = apiResponse[i];
        var type = location.noise_type;
        var latLon = new google.maps.LatLng(location.lat, location.lon);
        if (type === "Transit Center" || type === "Bus Stop" || type === "Trolley"){
          layers.transit.push({location: latLon, weight: 11});
        }
        else if (type === "Dump") {
          layers.dumps.push({location: latLon, weight: 10});
        }
        else if (type === "Fire Station") {
          layers.fireStations.push({location: latLon, weight: 14});
        }
        else if (type === "College") {
          layers.colleges.push({location: latLon, weight: 11});
        }
        else if (type === "School") {
          layers.schools.push({location: latLon, weight: 9});
        }
        else if (type === "Police Station") {
          layers.policeStations.push({location: latLon, weight: 14});
        }
        else if (type === "Hospital") {
          layers.hospitals.push({location: latLon, weight: 14});
        }
        else if (type === "Bars") {
          layers.bars.push({location: latLon, weight: 10});
        }
      }

      return layers;
    },
    createLayer: function(scope, heatmapName, allLayers) {
      scope[heatmapName] = new google.maps.visualization.HeatmapLayer({
        data: allLayers[heatmapName]
      });
      
      scope[heatmapName].setMap(scope.map);
    }
  }
});

servicesModule.factory('locationService', function() {
  return {
    newMarker: function(coordinates, scope, markers) {
      // clear any current markers
      for (var i = 0; i < markers.length; i++) {
        markers[i].setMap(null);
      }
      markers = [];

      // create new marker
      marker = new google.maps.Marker({
        position: coordinates,
        map: scope.map
      });
      markers.push(marker);

      // zoom to new marker
      scope.map.setZoom(15);
      scope.map.setCenter(marker.getPosition());
    }
  }
});