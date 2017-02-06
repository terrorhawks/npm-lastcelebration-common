angular.module('common.services')

.factory('ResourceHandler', function() {

  var resourceHandler = {};
  var interceptAuth = false;

  resourceHandler.set = function( newInterceptAuth ) {
    interceptAuth = newInterceptAuth;
  };

  resourceHandler.get = function() {
    return interceptAuth;
  };

  // wrap given actions of a resource to send auth interceptAuth with every
  // request
  resourceHandler.wrapActions = function( resource, actions ) {
    // copy original resource
    var wrappedResource = resource;
    for (var i=0; i < actions.length; i++) {
      reousrceWrapper( wrappedResource, actions[i] );
    }
    // return modified copy of resource
    return wrappedResource;
  };

  // wraps resource action to send request with auth interceptAuth
  var reousrceWrapper = function( resource, action ) {
    // copy original action
    resource['_' + action]  = resource[action];
    // create new action wrapping the original and sending interceptAuth
    resource[action] = function( data, success, error){
      return resource['_' + action](
        angular.extend({}, data || {}, {interceptAuth: resourceHandler.get()}),
        success,
        error
      );
    };
  };

  return resourceHandler;
});