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

.factory('OfferService', [ function() {

  var offer = {};
  var offers = {};

  return  {
    storeOffer: function(data){
      offer = data;
    },

    getOffer: function(){
      return offer;
    },

    storeOffers: function(data){
      offers = data;
    },

    getOffers: function(){
      return offers;
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

.factory('S3', ['$q', '$http', '$cordovaDevice', 'domainName', 'awsImageUploadBucket', 'uuid4', '$upload', function($q, $http, $cordovaDevice, domainName, awsImageUploadBucket, uuid4, $upload) {

  var s3_config;
  var purge_date;
  //cached for 50 seconds
  var ttl_in_ms = 50000;

  // function postFormData(uri, formData) {
  //   var deferred = $q.defer();
  //     $http.post(uri, formData, {
  //       transformRequest: angular.identity,
  //       headers: {'Content-Type': undefined}
  //     }).success(function (response, status) {
  //       deferred.resolve(response);
  //     }).error(function (error, status) {
  //       deferred.reject(error);
  //     });
  //   return deferred.promise;
  // }

  function uploadS3(key, params, image_uri, s3_uri) {
    $upload.upload({
        url: s3_uri, //S3 upload url including bucket name,
        method: 'POST',
        data : {
          key: key, // the key to store the file on S3, could be file name or customized
          AWSAccessKeyId: params.key, 
          acl: 'public-read', // sets the access to the uploaded file in the bucket: private or public 
          policy: params.policy, // base64-encoded json policy (see article below)
          signature: params.signature, // base64-encoded signature based on policy string (see article below)
          "Content-Type": 'application/octet-stream', // content type of the file (NotEmpty),
          filename: key // this is needed for Flash polyfill IE8-9
        },
        file: image_uri
      });
  }

  function uploadToS3(key, params, imageURI, s3URI) {
 
        var deferred = $q.defer(),
            ft = new FileTransfer(),
            options = new FileUploadOptions();
 
        options.fileKey = "file";
        options.fileName = key; 
        options.mimeType = "image/jpeg";
        options.chunkedMode = false;
        options.httpMethod = 'POST';
        options.headers = {
            'Content-Type': 'application/octet-stream'
        };
        options.params = {
            "key": key,
            "AWSAccessKeyId": params.key,
            "acl": 'public-read',
            "policy": params.policy,
            "signature": params.signature,
            "Content-Type": 'application/octet-stream'
        };
        console.log("uploading to s3...");
        console.log(imageURI);
        console.log(s3URI);
        console.log(options);

        ft.upload(imageURI, encodeURI(s3URI),
            function (e) {
                deferred.resolve(e);
            },
            function (e) {
                console.log(e);
                deferred.reject(e);
            }, options);
 
        return deferred.promise;
 
    }

  // function createFormData(key, options, byteArray) {
  //   var fd = new FormData();
  //   fd.append('key', key + '.jpg');
  //   fd.append('acl', 'public-read');
  //   fd.append('Content-Type', 'image/jpeg');
  //   fd.append('AWSAccessKeyId', options.key);
  //   fd.append('policy', options.policy);
  //   fd.append('signature', options.signature);
  //   fd.append('file', byteArray);
  //   return fd;
  // }

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

  function create_folder() {
    try {
      return $cordovaDevice.getUUID();
    } catch (exception) {
      return "development";
    }
  }

  return {
    
    sha: function(email) {
      return sha1(email);
    },

    upload: function(image_uri) {
      var deferred = $q.defer();        
      getAWSPolicy().then(function (options) {
          var s3Uri = 'https://' + awsImageUploadBucket + '.s3.amazonaws.com/';      
          var folder = create_folder();
          //var file = folder + '/' + uuid4.generate();
          var file = uuid4.generate();
          var file_uri = s3Uri + file;

          console.log("Upload image from " + image_uri);
          
          uploadToS3(file, options, image_uri, file_uri).then(function (response) {
          //var fd = createFormData(file,  options, byteArray);
          //postFormData(s3Uri, fd).then(function (response) {
            deferred.resolve(file_uri);
          }, function (error) {
            deferred.reject(error);
          });
        }, function(error) {
          deferred.reject(error);
        });
      return deferred.promise;
    }
  };

}]);