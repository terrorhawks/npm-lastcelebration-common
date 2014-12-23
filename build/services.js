angular.module('common.services')

.factory('Account', ['$q', '$http', 'domainName', function($q, $http, domainName) {
return {
  changePassword: function (password, device) {
    var deferred = $q.defer();
    $http({
      url: domainName + '/api/accounts',
      method: "POST",
      dataType: 'json',
      data: {password: password,
             device: device},
      params: {'change_password': true},
      headers: {
        "Content-Type": "application/json"
      }
    })
      .success(function (response) {
        deferred.resolve(response);
      })
      .error(function (error, status) {
        deferred.reject(error);
      });
    return deferred.promise;
  },

  resetPassword: function (email, device) {
    var deferred = $q.defer();
    $http({
      url: domainName + '/api/accounts',
      method: "POST",
      dataType: 'json',
      data: {email: email,
             device: device},
      params: {'reset_password': true},
      headers: {
        "Content-Type": "application/json"
      }
    })
      .success(function (response) {
        deferred.resolve(response);
      })
      .error(function (error, status) {
        deferred.reject(error);
      });
    return deferred.promise;
  }
};
}]);
angular.module('common.services')

.factory('authInterceptor', function ($rootScope, $q, $window) {
  return {
    request: function (config) {
      var not_aws_request = config.url.search(/lastcelebration-images.s3.amazonaws.com/)===-1;
      var have_a_session_token = $window.sessionStorage.token;
      config.headers = config.headers || {};
      if (have_a_session_token && not_aws_request) {
        //config.headers.Authorization = 'Bearer ' + $window.sessionStorage.token;
        config.headers.Authorization = $window.sessionStorage.token;
        config.headers['X-API-EMAIL'] = $window.sessionStorage.email;
      }
      return config;
    },
    response: function (response) {
      if (response.status === 401) {
        // handle the case where the user is not authenticated
      }
      return response || $q.when(response);
    }
  };
});

angular.module('common.services')

.factory('Location', ['$q', '$http', 'domainName', function($q, $http, domainName) {
 
  return {
    getClosestPostcode: function(latitude, longitude) {
      var deferred = $q.defer();
      $http({
        url: domainName + '/api/locations', 
        method: "GET",
        params: {latitude: latitude, longitude: longitude}
      })
      .success(function(response) {
        deferred.resolve(response);
      })
      .error(function (error, status) {
        deferred.reject(error);
      });
      return deferred.promise;
    }

  };
}]);
angular.module('common.services')

.factory('Proposition', ['$q', '$http', 'domainName', function($q, $http, domainName) {

  var site = {};

  return {

    storeSite: function(data) {
      site = data;
    },

    getSite: function() {
      return site;
    },

    customers: function () {
      var deferred = $q.defer();
      $http({
        url: domainName + '/api/propositions', 
        method: "GET",
        dataType: 'json',
        data: '',
        params: {customers: true},
        interceptAuth: true,
        headers: {
          "Content-Type": "application/json"
        }
      })
      .success(function(response) {
        deferred.resolve(response);
      })
      .error(function (error, status) {
        deferred.reject(error);
      });
      return deferred.promise;
    },

    replies: function() {
      var deferred = $q.defer();
      $http({
        url: domainName + '/api/propositions', 
        method: "GET",
        dataType: 'json',
        data: '',
        params: {replies: true},
        interceptAuth: true,
        headers: {
          "Content-Type": "application/json"
        }
      })
      .success(function(response) {
        deferred.resolve(response);
      })
      .error(function (error, status) {
        deferred.reject(error);
      });
      return deferred.promise;
    },

    chat: function(proposition_id) {
      var deferred = $q.defer();
      $http({
        url: domainName + '/api/propositions/' + proposition_id,
        method: "GET",
        dataType: 'json',
        data: '',
        params: {chat: true },
        interceptAuth: true,
        headers: {
          "Content-Type": "application/json"
        }
      })
      .success(function(response) {
        deferred.resolve(response);
      })
      .error(function (error, status) {
        deferred.reject(error);
      });
      return deferred.promise;
    }

  };
}]);
angular.module('common.services')

.factory('S3', ['$q', '$http', 'domainName', function($q, $http, domainName) {

  var s3_config;
  var purge_date;
  //cached for 50s
  var ttl_in_ms = 50000;

  function postFormData(uri, formData) {
    var deferred = $q.defer();
      $http.post(uri, formData, {
        transformRequest: angular.identity,
        headers: {'Content-Type': undefined}
      }).success(function (response, status) {
        deferred.resolve(response);
      }).error(function (error, status) {
        deferred.reject(error);
      });
    return deferred.promise;
  }

  function createFormData(key, options, imageBase64) {
    var fd = new FormData();
    fd.append('key', key);
    fd.append('acl', 'public-read');
    fd.append('Content-Type', 'image/jpeg');
    fd.append('AWSAccessKeyId', options.key);
    fd.append('policy', options.policy);
    fd.append('signature', options.signature);
    fd.append('file', imageBase64);
    return fd;
  }

  function getAWSPolicy() {
    var deferred = $q.defer();
    if (s3_config && purge_date > new Date().getTime()) {
      deferred.resolve(s3_config);
    } else {
      $http.get(domainName + '/api/s3')
        .success(function(response) {
          s3_config = response;
           purge_date = new Date().getTime() + ttl_in_ms;
          deferred.resolve(response);
        })
        .error(function (error, status) {
          deferred.reject(error);
        });
    }
    return deferred.promise;
  }

    return {
    
    sha: function(email) {
      return sha1(email);
    },

    upload: function(media, key, folder) {
      var deferred = $q.defer();
      if (media.uri) {
        //already been uploaded
        deferred.resolve(media);
      } else {
        var s3Uri = 'https://lastcelebration-images.s3.amazonaws.com/';      
        getAWSPolicy().then(function (options) {
          var file = folder + '/' + key;
          var file_uri = s3Uri + file;
          var fd = createFormData(file,  options, media.data);
          postFormData(s3Uri, fd).then(function (response) {
            media.content_type =  'image/jpg';
            media.uri = file_uri;
            deferred.resolve(media);
          }, function (error) {
            deferred.reject(error);
          });
        }, function(error) {
          deferred.reject(error);
        });
      }
      return deferred.promise;
    }
  };

}]);