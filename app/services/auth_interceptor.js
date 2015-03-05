var authInterceptor = function ($rootScope, $q, $window, awsImageUploadBucket, awsSiteImageUploadBucket) {
  return {
    request: function (config) {
      var not_aws_request = config.url.search(/awsImageUploadBucket/)===-1 &&  config.url.search(/awsSiteImageUploadBucket/)===-1;
      var have_a_session_token = $window.sessionStorage.token;
      config.headers = config.headers || {};
      if (have_a_session_token && not_aws_request) {
        //config.headers.Authorization = 'Bearer ' + $window.sessionStorage.token;
        config.headers.Authorization  = $window.sessionStorage.token;
        config.headers['X-API-EMAIL'] = $window.sessionStorage.email;
      }
      return config;
    },
    response: function (response) {
      if (response.status === 401) {
        // handle the case where the user is not authenticated
      }
      return response || $q.when(response);
    },
    responseError: function(rejection) {
      if (rejection.status === 500 || rejection.status === 404 || rejection.status === 403) {
        $rootScope.$broadcast("redirect:home");
      }
      return $q.reject(rejection);
    }
  };
};

authInterceptor.$inject = ['$root', '$q', '$window', 'awsImageUploadBucket', 'awsSiteImageUploadBucket'];
angular.module('common.services').factory('authInterceptor', authInterceptor);