angular.module('common.services')

.factory('authInterceptor', function(companyRef, $hyperfoodstorage, $rootScope, $q, $window, domainName, companyUUID, $localStorage) {
    
    var CACHE_TOKEN =           companyRef + '.userAuth.token';
    var CACHE_EMAIL =           companyRef + '.userAuth.email';
    var CACHE_FB    =           companyRef + '.userAuth.fb';
    var CACHE_COMPANY_UUID =    companyRef + '.userAuth.company';

  return {
    request: function (config) {
      
      var suffix = '.html';
      var endsWithHTML = config.url.indexOf(suffix, config.url.length - suffix.length) !== -1;
      var is_a_request_to_s3_bucket = config.url.search('s3.amazonaws.com')!==-1;

      if (is_a_request_to_s3_bucket) {
        console.warn("request to s3 bucket ignored", config.url);
      }

      if (!endsWithHTML && !is_a_request_to_s3_bucket) {
        
        console.log("add tokens for request ", config.url);

        var is_a_request_to_original_domain = config.url.search(domainName)!==-1;
        var have_a_session_token = $hyperfoodstorage.getObject(CACHE_TOKEN);
        // var have_a_session_token = $window.sessionStorage.token;
        config.headers = config.headers || {};
        if (is_a_request_to_original_domain) {
          if (have_a_session_token) {
            // NOT REQUIRED config.headers.Authorization = 'Bearer ' + $window.sessionStorage.token;
            // config.headers.Authorization  = $window.sessionStorage.token;
            // config.headers['X-API-EMAIL'] = $window.sessionStorage.email;
            config.headers.Authorization  = have_a_session_token;
            config.headers['X-API-EMAIL'] = $hyperfoodstorage.getObject(CACHE_EMAIL);
            config.headers['X-API-FB']    = $hyperfoodstorage.getObject(CACHE_FB);

          }
          if (companyUUID) {
              // mobile apps use pre-configured companyUUID
              config.headers['X-COMPANY-UUID'] = companyUUID;
          } else {
              // dashboard uses companyUUID from authenticated user
               config.headers['X-COMPANY-UUID'] = $hyperfoodstorage.getObject(CACHE_COMPANY_UUID);
              // config.headers['X-COMPANY-UUID'] = $window.sessionStorage.companyUUID;
          }
        }
    }

      return config;
    },
    response: function (response) {
      return response || $q.when(response);
    },
    responseError: function(rejection) {
      console.log("Response failure", JSON.stringify(rejection));
      if (rejection.status === 401) {
        $hyperfoodstorage.setObject(CACHE_TOKEN);
        $hyperfoodstorage.setObject(CACHE_EMAIL);
        $hyperfoodstorage.setObject(CACHE_COMPANY_UUID);
        $rootScope.authenticatedUser = undefined;
        delete $localStorage.authenticatedUser;
      }
      if (rejection.status === 404 || rejection.status === 403) {
        $rootScope.$broadcast("redirect:home");
      }
      return $q.reject(rejection);
    }
  };
});