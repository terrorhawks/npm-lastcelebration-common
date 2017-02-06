angular.module('common.services')

.factory('$hyperfoodstorage', ['$window', 'appVersion', function($window, appVersion) {
  
  var getObjectFromStorage = function(key) {
      var cached_object = $window.localStorage[key + appVersion];
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
        $window.localStorage[key + appVersion] = value;
      } else {
        $window.localStorage.removeItem(key + appVersion);
      }
    },

    get: function(key, defaultValue) {
      return $window.localStorage[key + appVersion] || defaultValue + appVersion;
    },

    setObject: function(key, value, cacheTime) {
      if (value) {
        if (cacheTime && cacheTime>0) {
            var timeToExpire = new Date(Date.now() + cacheTime).getTime();
            var cacheTimeKey = key + ".cacheTime" + appVersion;
            console.log("setting cache time to ", timeToExpire);
            $window.localStorage[cacheTimeKey] = timeToExpire;
        }
        console.log("storing object in cache with key", key + appVersion);
        $window.localStorage[key + appVersion] = JSON.stringify(value);
      } else {
        $window.localStorage.removeItem(key + appVersion);
      }
    },

    clear: function() {
      console.log("WARNING: clearing cache");
      $window.localStorage.clear();
    },

    getObject: function(key, checkCacheExpiry) {
      if (checkCacheExpiry) {
        var cacheTimeKey = key + ".cacheTime" + appVersion;
        var timeToExpire = $window.localStorage[cacheTimeKey];
        var timenow = Date.now();
        if (timenow <= timeToExpire) {
          console.log("not expired yet, get from cache with key", key + appVersion);
          return getObjectFromStorage(key + appVersion);
        }  else {
          console.log("cache expired for key", key + appVersion);
          //lets avoid this to allow stale items to still be used in an emergency!
          //$window.localStorage.removeItem(key + appVersion);
          return undefined;
        }
      } else {
        console.log("get object without checking cache time with key", key + appVersion);
        return getObjectFromStorage(key + appVersion);
      }
    }
  };

}]);