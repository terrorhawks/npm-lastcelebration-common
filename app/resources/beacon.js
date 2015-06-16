angular.module('common.resources')

.factory('Beacon', ['$resource', 'domainName', function ($resource, domainName) {

  return  $resource(domainName + '/api/beacons/:id', { id: '@id' }, {

    create: {
      method: 'POST'
    },
    
    query: {
      isArray: true
    }

  });

}]);