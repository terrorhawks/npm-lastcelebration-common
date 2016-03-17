angular.module('common.services')

.factory('Location', ['$q', '$http', 'domainName', function($q, $http, domainName) {
 
  return {
    getClosestPostcode: function(latitude, longitude) {
      return $http({
        url: domainName + '/api/locations', 
        method: "GET",
        params: {latitude: latitude, longitude: longitude}
      });
    }

  };
}]);