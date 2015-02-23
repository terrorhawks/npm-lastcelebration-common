angular.module('common.services')

.factory('Clover', ['$q', '$http', function($q, $http) {

//   params: {filter: "filter\=name%3D" + item_label, access_token: '9234cf00-3b4d-6863-ed9d-d2d2310fff69'},
     
  return {

    items: function (item_label) {
      var deferred = $q.defer();
      $http({
        url: 'https://api.eu.clover.com/v3/merchants/XTN9TJ5X3QAM0/tags', 
        method: "GET",
        dataType: 'json',
        data: '',
        params: {filter: "filter\=name%3D" + item_label},
        interceptAuth: false,
        headers: {
          "Content-Type": "application/json"
        }
      })
      .success(function(response) {
        deferred.resolve(response);
      })
      .error(function (error, status) {
        deferred.reject(error);
      });
      return deferred.promise;
    }

  };
}]);