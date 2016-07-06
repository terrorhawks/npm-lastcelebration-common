angular.module('common.resources')

.factory('ProductOptionGroup', ['$resource', 'domainName', function ($resource, domainName) {

  return  $resource(domainName + '/api/dashboard/product_option_groups/:id', { id: '@id' }, {

    create: {
      method: 'POST'
    },

    update: {
      method: 'PUT'
    },
    
    query: {
      isArray: true
    },

    delete: {
      method: 'DELETE'
    }

  });

}]);