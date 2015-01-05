angular.module('common.services')

.factory('SharedService', [ function() {

  var data = {};

  return  {
    store: function(name, data) {
      data[name] = data;
    },

    get: function(name) {
        return data[name];
    }
  };

}]);