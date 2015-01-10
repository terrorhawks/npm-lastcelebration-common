angular.module('common.services')

.factory('$localstorage', ['$window', function($window) {
  return {
    
    set: function(key, value) {
      $window.localStorage[key] = value;
    },

    get: function(key, defaultValue) {
      return $window.localStorage[key] || defaultValue;
    },

    setObject: function(key, value) {
      if (value) {
        $window.localStorage[key] = JSON.stringify(value);
      } else {
        $window.localStorage.removeItem(key);
      }
    },

    getObject: function(key) {
      var cached_object = $window.localStorage[key];
      console.log(cached_object);
      if (cached_object) {
        try {
          return JSON.parse(cached_object);
        } catch (exception) {
          console.log(exception);
          return undefined;
        }
      } else {
        return undefined;
      }
    }
  };

}]);