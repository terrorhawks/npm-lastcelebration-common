angular.module('common.resources')

.factory('Product', ['$resource', 'domainName', function ($resource, domainName) {

  return  $resource(domainName + '/api/dashboard/products/:id', { id: '@id' }, {

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