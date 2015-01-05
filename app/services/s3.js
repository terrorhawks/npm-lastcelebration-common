angular.module('common.services')

.factory('S3', ['$q', '$http', 'domainName', 'awsImageUploadBucket', function($q, $http, domainName, awsImageUploadBucket) {

  var s3_config;
  var purge_date;

  //cached for 50mins
  var ttl_in_ms = 300000;

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

  function createFormData(key, options, image_uri) {
    var fd = new FormData();
    fd.append('key', key);
    fd.append('acl', 'public-read');
    fd.append('Content-Type', 'image/jpeg');
    fd.append('AWSAccessKeyId', options.key);
    fd.append('policy', options.policy);
    fd.append('signature', options.signature);
    fd.append('file', image_uri);
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
        var s3Uri = 'https://' + awsImageUploadBucket + '.s3.amazonaws.com/';      
        getAWSPolicy().then(function (options) {
          var file = folder + '/' + key;
          var file_uri = s3Uri + file;
          var fd = createFormData(file,  options, media.local_uri);
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