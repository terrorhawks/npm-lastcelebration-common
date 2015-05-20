angular.module('common.services')

.factory('$localstorage', ['$window', function($window) {
  
  var getObjectFromStorage = function(key) {
      var cached_object = $window.localStorage[key];
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
  };

  return {
    
    set: function(key, value) {
      if (value) {
        $window.localStorage[key] = value;
      } else {
        $window.localStorage.removeItem(key);
      }
    },

    get: function(key, defaultValue) {
      return $window.localStorage[key] || defaultValue;
    },

    setObject: function(key, value, cacheTime) {
      if (value) {
        if (cacheTime && cacheTime>0) {
            var timeToExpire = new Date(Date.now() + cacheTime).getTime();
            var cache_time_key = key + ".cacheTime";
            $window.localStorage[cache_time_key] = timeToExpire;
        }
        $window.localStorage[key] = JSON.stringify(value);
      } else {
        $window.localStorage.removeItem(key);
      }
    },

    clear: function() {
      $window.localStorage.clear();
    },

    getObject: function(key, checkCacheExpiry) {
      if (checkCacheExpiry) {
        var cache_time_key = key + ".cacheTime";
        var time_to_expire = $window.localStorage[cache_time_key];
        var timenow = Date.now();
        if (timenow <= time_to_expire) {
          getObjectFromStorage(key);
        }  else {
          console.log("cache expired for key", key);
          $window.localStorage.removeItem(key);
        }
      } else {
        getObjectFromStorage(key);
      }
      
    }
  };

}]);