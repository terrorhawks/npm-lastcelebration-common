angular.module('common.services')

.factory('OfferService', ['$q', '$http', 'domainName', function($q, $http, domainName) {

  var offer = {};
  var offers = {};

  return  {
    storeOffer: function(data){
      offer = data;
    },

    getOffer: function(){
      return offer;
    },

    storeOffers: function(data){
      offers = data;
    },

    getOffers: function(){
      return offers;
    },

    offers: function (propositionId) {
        var deferred = $q.defer();
        $http({
          url: domainName + '/api/offers',
          method: "GET",
          dataType: 'json',
          data: '',
          params: {proposition_id: propositionId},
          interceptAuth: true,
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
    },

    save: function (offer, propositionId) {
      var deferred = $q.defer();
      $http({
        url: domainName + '/api/offers',
        method: "POST",
        dataType: 'json',
        data: offer,
        params: {proposition_id: propositionId},
        headers: {
          "Content-Type": "application/json"
        }
      })
        .success(function (response) {
          deferred.resolve(response);
        })
        .error(function (error, status) {
          deferred.reject(error);
        });
      return deferred.promise;
    }
  };

}]);