angular.module('common.resources')

.factory('User', ['$resource', 'domainName', 'resourceHandler', function ($resource, domainName, resourceHandler) {

    var resource =  $resource(domainName + '/api/users/:id', { id: '@id' }, {

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

  resource = resourceHandler.wrapActions(resource, ["update"]);

  return resource;

}]);