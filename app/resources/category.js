angular.module('common.resources')

.factory('Category', ['$resource', 'domainName', function ($resource, domainName) {

  return  $resource(domainName + '/api/dashboard/categories/:id', { id: '@id' }, {

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