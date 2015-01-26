angular.module('common.resources')

.factory('OfferProfile', ['$resource', 'domainName', function ($resource, domainName) {

  return  $resource(domainName + '/api/offers_profile/:id', { id: '@id' }, {

    create: {
      method: 'POST'
    },

    update: {
      method: 'PUT'
    },
    
    query: {
      isArray: true
    }

  });

}]);