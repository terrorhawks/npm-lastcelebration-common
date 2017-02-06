angular.module('common.resources')

.factory('User', ['$resource', 'domainName', 'ResourceHandler', function ($resource, domainName, ResourceHandler) {

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

  resource = ResourceHandler.wrapActions(resource, ["update"]);

  return resource;

}]);