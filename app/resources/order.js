angular.module('common.resources')

.factory('Order', ['$resource', 'domainName', function ($resource, domainName) {

  return  $resource(domainName + '/api/ecommerce/orders/:id', { id: '@id' }, {

    create: {
      method: 'POST'
    },
    
    query: {
      isArray: true
    }

  });

}]);