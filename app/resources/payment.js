angular.module('common.resources')

.factory('Payment', ['$resource', 'domainName', function ($resource, domainName) {

  return  $resource(domainName + '/api/payments/:id', { id: '@id' }, {

    create: {
      method: 'POST'
    }

  });

}]);