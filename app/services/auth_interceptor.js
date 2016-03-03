angular.module('common.services')

.factory('authInterceptor', function(companyRef, $localstorage,$rootScope, $q, $window, domainName, companyUUID) {
    
    var CACHE_TOKEN =           companyRef + '.userAuth.token';
    var CACHE_EMAIL =           companyRef + '.userAuth.email';
    var CACHE_COMPANY_UUID =    companyRef + '.userAuth.company';

  return {
    request: function (config) {
      
      var suffix = '.html';
      var endsWithHTML = config.url.indexOf(suffix, config.url.length - suffix.length) !== -1;

      if (!endsWithHTML) {
        
        console.log("add tokens for request ", config.url);

        var is_a_request_to_original_domain = config.url.search(domainName)!==-1;
        var have_a_session_token = $localstorage.getObject(CACHE_TOKEN);
        // var have_a_session_token = $window.sessionStorage.token;
        config.headers = config.headers || {};
        if (have_a_session_token && is_a_request_to_original_domain) {
          // NOT REQUIRED config.headers.Authorization = 'Bearer ' + $window.sessionStorage.token;
          // config.headers.Authorization  = $window.sessionStorage.token;
          // config.headers['X-API-EMAIL'] = $window.sessionStorage.email;
          config.headers.Authorization  = have_a_session_token;
          config.headers['X-API-EMAIL'] = $localstorage.getObject(CACHE_EMAIL);
        }
        if (companyUUID) {
            // mobile apps use pre-configured companyUUID
            config.headers['X-COMPANY-UUID'] = companyUUID;
        } else {
            // dashboard uses companyUUID from authenticated user
             config.headers['X-COMPANY-UUID'] = $localstorage.getObject(CACHE_COMPANY_UUID);
            // config.headers['X-COMPANY-UUID'] = $window.sessionStorage.companyUUID;
        }
    }

      return config;
    },
    response: function (response) {
      return response || $q.when(response);
    },
    responseError: function(rejection) {
      console.log("Response failure", JSON.stringify(rejection));
      // if (rejection.status === 500) {
      //   $rootScope.$broadcast("redirect:error");
      // }
      if (rejection.status === 404 || rejection.status === 403) {
        $rootScope.$broadcast("redirect:home");
      }
      return $q.reject(rejection);
    }
  };
});