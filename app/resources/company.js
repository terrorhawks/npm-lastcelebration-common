angular.module('common.resources')

.factory('Company', ['$resource', 'domainName', function ($resource, domainName) {

  return  $resource(domainName + '/api/companies/:id', { id: '@id' }, {

    query: {
      isArray: true
    }

  });

}]);