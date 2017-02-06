angular.module('common.resources')

.factory('User', ['$resource', 'domainName', function ($resource, domainName) {

  return  $resource(domainName + '/api/users/:id', { id: '@id' }, {

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