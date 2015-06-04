angular.module('common.resources')

.factory('Track', ['$resource', 'domainName', function ($resource, domainName) {

  return  $resource(domainName + '/api/ecommerce/tracks/:id', { id: '@id' }, {

    create: {
      method: 'POST'
    },
    
    query: {
      isArray: true
    }

  });

}]);