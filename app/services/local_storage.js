angular.module('common.services')

.factory('$localstorage', ['$window', 'companyRef', function($window, companyRef) {
  
  var getObjectFromStorage = function(key) {
      key = actual_key(key);
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

  var actual_key = function(key) {
    return companyRef + "." + key;
  };

  return {
    
    set: function(key, value) {
      key = actual_key(key);
      if (value) {
        $window.localStorage[key] = value;
      } else {
        $window.localStorage.removeItem(key);
      }
    },

    get: function(key, defaultValue) {
      key = actual_key(key);
      return $window.localStorage[key] || defaultValue;
    },

    setObject: function(key, value, cacheTime) {
      key = actual_key(key);
      if (value) {
        if (cacheTime && cacheTime>0) {
            var timeToExpire = new Date(Date.now() + cacheTime).getTime();
            var cacheTimeKey = key + ".cacheTime";
            console.log("setting cache time to ", timeToExpire);
            $window.localStorage[cacheTimeKey] = timeToExpire;
        }
        console.log("storing object in cache with key", key);
        $window.localStorage[key] = JSON.stringify(value);
      } else {
        $window.localStorage.removeItem(key);
      }
    },

    clear: function() {
      $window.localStorage.clear();
    },

    getObject: function(key, checkCacheExpiry) {
      key = actual_key(key);
      if (checkCacheExpiry) {
        var cacheTimeKey = key + ".cacheTime";
        var timeToExpire = $window.localStorage[cacheTimeKey];
        var timenow = Date.now();
        if (timenow <= timeToExpire) {
          console.log("not expired yet, get from cache with key", key);
          return getObjectFromStorage(key);
        }  else {
          console.log("cache expired for key", key);
          //lets avoid this to allow stale items to still be used in an emergency!
          //$window.localStorage.removeItem(key);
          return undefined;
        }
      } else {
        console.log("get object without checking cache time with key", key);
        return getObjectFromStorage(key);
      }
    }
  };

}]);