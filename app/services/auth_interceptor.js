angular.module('common.services')

.factory('authInterceptor', function ($rootScope, $q, $window, domainName, companyUUID) {
  return {
    request: function (config) {
      var is_a_request_to_original_domain = config.url.search(domainName)!==-1;
      var have_a_session_token = $window.sessionStorage.token;
      config.headers = config.headers || {};
      if (have_a_session_token && is_a_request_to_original_domain) {
        //config.headers.Authorization = 'Bearer ' + $window.sessionStorage.token;
        config.headers.Authorization  = $window.sessionStorage.token;
        config.headers['X-API-EMAIL'] = $window.sessionStorage.email;
      }
      if (companyUUID) {
          config.headers['X-COMPANY-UUID'] = companyUUID;
      }
      return config;
    },
    response: function (response) {
      return response || $q.when(response);
    },
    responseError: function(rejection) {
      console.log("Response failure", rejection);
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