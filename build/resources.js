angular.module('common.resources')

.factory('Message', ['$resource', 'domainName', function ($resource, domainName) {

  return  $resource(domainName + '/api/messages/:messageId', { proposition_id: '@proposition_id' }, {
    query: {
      isArray: true
    },
    save: {
      method: 'POST'
    }
  });
}]);
angular.module('common.resources')

.factory('Offer', ['$resource', 'domainName', function ($resource, domainName) {

  return  $resource(domainName + '/api/offers/:id', { id: '@id' }, {

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
angular.module('common.resources')

.factory('PropositionMedia', ['$resource', 'domainName', function ($resource, domainName) {

  return  $resource(domainName + '/api/proposition_media/:propositionMediaId', { proposition_id: '@proposition_id' }, {
    query: {
      isArray: true
    },
    save: {
      method: 'POST'
    }
  });
}]);
angular.module('common.resources')

.factory('Requisition', ['$resource', 'domainName', function ($resource, domainName) {

  return  $resource(domainName + '/api/requisitions/:id', { id: '@id' }, {

    create: {
      method: 'POST'
    },

    update: {
      method: 'PUT'
    },
    
    query: {
      isArray: false 
    }

  });

}]);
angular.module('common.resources')

.factory('Site', ['$resource', 'domainName', function ($resource, domainName) {

  return  $resource(domainName + '/api/sites/:id', { id: '@id' }, {

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