var servicesModule = angular.module('servicesModule', []);

servicesModule.factory('filterService', function() {
  return {
    excludeOneNoise: function(excludedNoises, layerName) {
      var i = excludedNoises.indexOf(layerName);
      if (i === -1) {
        excludedNoises.push(layerName);
      } else {
        excludedNoises.splice(i, 1);
      }
    },
    excludeAllNoises: function(status) {
      if (status) {
        return [
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
        return [];
      }
    },
    showAllD3Elements: function(status) {
      var svgs = angular.element(document.getElementsByTagName('svg'));
      if (status) {
        svgs.removeClass('hide');
      } else {
        svgs.addClass('hide');
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
  };
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
      var marker = new google.maps.Marker({
        position: coordinates,
        map: scope.map,
        zIndex: 99
      });
      scope.markers.push(marker);

      // Zoom To New Marker
      scope.map.setZoom(15);
      scope.map.panTo(marker.getPosition());

      // Add Circle
      this.scoreCircle(coordinates, scope);

      // Add Popup
      this.scorePopup(coordinates, marker, scope);
    },
    scoreCircle: function(coordinates, scope) {
      // Clear Any Current Circles
      for (var i = 0; i < scope.circles.length; i++) {
        scope.circles[i].setMap(null);
      }
      scope.circles = [];

      // Set Options for Circle
      var populationOptions = {
        strokeColor: '#00cc00',
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: '#00cc00',
        fillOpacity: 0.35,
        map: scope.map,
        center: coordinates,
        radius: 64
      };

      // Add Circle to Map & Array
      var newCircle = new google.maps.Circle(populationOptions);
      scope.circles.push(newCircle);
    },
    scorePopup: function(coordinates, marker, scope) {
      var url = 'http://api.shutupseattle.com/score?latitude=' + coordinates.lat + '&longitude=' + coordinates.lng;
      $http.get(url).success(function(data) {
        // Clear Any Current Popups
        for (var i = 0; i < scope.popups.length; i++) {
          scope.popups[i].setMap(null);
        }
        scope.popups = [];

        // Create Score String
        var nearbyNoises = '';
        for (var noise in data.noises) {
          var target_noise = data.noises[noise];
          nearbyNoises += '<p><span class="glyphicon glyphicon-' +
                          target_noise.icon +
                          ' score-icon"></span><strong>' +
                          target_noise.noise_type + '</strong>';

          if (target_noise.details !== null) {
            nearbyNoises += '<ul>';
            for (var i = 0; i < target_noise.details.length; i++) {
              nearbyNoises += '<li>' + target_noise.details[i] + '</li>';
            }
            nearbyNoises += '</ul>';
          }
          nearbyNoises += '</p>';
        }

        var scoreType;
        if (data.score === 'A') {
          scoreType = 'good-score';
        } else if (data.score === 'F') {
          scoreType = 'bad-score';
        } else {
          scoreType = 'med-score';
        }

        var contentString = '<div id="content">' +
          '<div id="siteNotice">' +
          '</div>' +
          '<h1 id="firstHeading" class="firstHeading text-center">Location Score</h1>' +
          '<div id="bodyContent">' +
          '<div class="scoreIcon ' +
          scoreType +
          '">' +
          '<h2 class="text-center">' +
          data.score + '</h2>' +
          '</div>' +
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

        // Close InfoWindow if Map Clicked
        google.maps.event.addListener(scope.map, "click", function(){
          infowindow.close();
        });

        // Reopen InfoWindow if Marker Clicked
        google.maps.event.addListener(marker, 'click', function() {
          infowindow.open(scope.map,marker);
        });
      });
    }
  };
}]);

servicesModule.factory('newLayerService', function() {
  return {
    setupLayer: function(apiResponse, excludedNoiseTypes) {
      var noiseArray = [];

      for (var i = 0; i < apiResponse.length; i++) {
        var location = apiResponse[i];
        var latLon = new google.maps.LatLng(location.lat, location.lon);
        var type = location.noise_type;
        var adjustedWeight = location.decibel * 0.15;

        if (excludedNoiseTypes.indexOf(type) === -1) {
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
    createD3Points: function(data, scope) {
      // Set Up Overlay
      var overlay = new google.maps.OverlayView();

      // Remove Freeways from Data
      var d3Points = [];
      for (var i = 0; i < data.length; i++) {
        if (data[i].noise_type !== 'freeway') {
          d3Points.push(data[i]);
        }
      }

      // Add the container when the overlay is added to the map.
      overlay.onAdd = function() {
        var layer = d3.select(this.getPanes().overlayMouseTarget)
          .append("div")
          .style("pointer-events", "none")
          .attr("class", "noises");

        // Draw each marker as a separate SVG element.
        overlay.draw = function() {
          var projection = this.getProjection(),
              padding = 200;

          var marker = layer.selectAll("svg")
              .data(d3.entries(d3Points))
              .each(transform) // update existing markers
            .enter().append("svg:svg")
              .each(transform)
              .attr("class", findClass);

          // Add a circle.
          marker.append("svg:circle")
              .attr("r", findRadius)
              .attr("cx", padding)
              .attr("cy", padding)
              .style("pointer-events", "all")
              .on("click", showNoiseDescrip);

          function transform(d) {
            d = new google.maps.LatLng(d.value.lat, d.value.lon);
            d = projection.fromLatLngToDivPixel(d);
            return d3.select(this)
                .style("left", (d.x - padding) + "px")
                .style("top", (d.y - padding) + "px");
          }

          function findClass(d) {
            return d.value.noise_type;
          }

          function findRadius(d) {
            return d.value.display_reach;
          }

          function showNoiseDescrip(d) {
            scope.currentNoiseType = formatNoiseDescrip(d.value.noise_type);
            scope.currentNoiseInfo = d.value.description;
            scope.$apply(scope);
          }

          function formatNoiseDescrip(noise_type) {
            if (noise_type === "fireStation") {
              return "Fire Station";
            }
            else if (noise_type === "heliportOrAirport") {
              return "Heliport/Airport";
            }
            else if (noise_type === "policeStation") {
              return "Police Station";
            }
            else if (noise_type === "noiseComplaints") {
              return "Noise Complaint";
            }
            else {
              var newTitle = noise_type.charAt(0).toUpperCase() + noise_type.slice(1);
              return newTitle;
            }
          }

        };
      };
      return overlay;
    },

    radiusMath: function(radius, originalZoom, newZoomLevel) {
      if (originalZoom > newZoomLevel) {
        return radius / 2;
      } else {
        return radius * 2;
      }
    },
    bigRadiusJump: function(radius, diff) {
      var posDiff = Math.abs(diff);
      for (var i = 0; i < posDiff; i++) {
        if (diff > 0) {
          radius = radius / 2;
        } else {
          radius = radius * 2;
        }
      }
      return radius;
    },
    adjustRadius: function(mapZoomLevel, newZoomLevel) {
      var diff = mapZoomLevel - newZoomLevel;
      var circles = document.getElementsByTagName('circle');

      for (var i = 0; i < circles.length; i++) {
        var circle = circles[i];
        var newRadius;
        if (diff === 1 || diff === -1) {
          newRadius = this.radiusMath(circle.r.baseVal.value, mapZoomLevel, newZoomLevel);
        } else if (diff > 1 || diff < -1) {
          newRadius = this.bigRadiusJump(circle.r.baseVal.value, diff);
        }
        angular.element(circle).attr('r', newRadius);
      }
    }
  }
});
