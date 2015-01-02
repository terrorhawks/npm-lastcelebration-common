angular.module('common.services')

.factory('OfferService', [ function() {

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
    }
  };

}]);