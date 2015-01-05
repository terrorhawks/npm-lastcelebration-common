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

.factory('S3', ['$q', '$http', 'domainName', 'awsImageUploadBucket', function($q, $http, domainName, awsImageUploadBucket) {

  var s3_config;
  var purge_date;

  /*
Copyright (c) 2011, Daniel Guerrero
All rights reserved.
Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:
    * Redistributions of source code must retain the above copyright
      notice, this list of conditions and the following disclaimer.
    * Redistributions in binary form must reproduce the above copyright
      notice, this list of conditions and the following disclaimer in the
      documentation and/or other materials provided with the distribution.
THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL DANIEL GUERRERO BE LIABLE FOR ANY
DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

  /**
   * Uses the new array typed in javascript to binary base64 encode/decode
   * at the moment just decodes a binary base64 encoded
   * into either an ArrayBuffer (decodeArrayBuffer)
   * or into an Uint8Array (decode)
   * 
   * References:
   * https://developer.mozilla.org/en/JavaScript_typed_arrays/ArrayBuffer
   * https://developer.mozilla.org/en/JavaScript_typed_arrays/Uint8Array
   */
  var Base64Binary = {
    _keyStr : "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",
    
    /* will return a  Uint8Array type */
    decodeArrayBuffer: function(input) {
      var bytes = (input.length/4) * 3;
      var ab = new ArrayBuffer(bytes);
      this.decode(input, ab);
      
      return ab;
    },
    
    decode: function(input, arrayBuffer) {
      //get last chars to see if are valid
      var lkey1 = this._keyStr.indexOf(input.charAt(input.length-1));    
      var lkey2 = this._keyStr.indexOf(input.charAt(input.length-2));    
    
      var bytes = (input.length/4) * 3;
      if (lkey1 == 64) bytes--; //padding chars, so skip
      if (lkey2 == 64) bytes--; //padding chars, so skip
      
      var uarray;
      var chr1, chr2, chr3;
      var enc1, enc2, enc3, enc4;
      var i = 0;
      var j = 0;
      
      if (arrayBuffer)
        uarray = new Uint8Array(arrayBuffer);
      else
        uarray = new Uint8Array(bytes);
      
      input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");
      
      for (i=0; i<bytes; i+=3) {  
        //get the 3 octects in 4 ascii chars
        enc1 = this._keyStr.indexOf(input.charAt(j++));
        enc2 = this._keyStr.indexOf(input.charAt(j++));
        enc3 = this._keyStr.indexOf(input.charAt(j++));
        enc4 = this._keyStr.indexOf(input.charAt(j++));
    
        chr1 = (enc1 << 2) | (enc2 >> 4);
        chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
        chr3 = ((enc3 & 3) << 6) | enc4;
    
        uarray[i] = chr1;     
        if (enc3 != 64) uarray[i+1] = chr2;
        if (enc4 != 64) uarray[i+2] = chr3;
      }
    
      return uarray;  
    }
  };

  //cached for 50 seconds
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

  function createFormData(key, options, byteArray) {
    var fd = new FormData();
    fd.append('key', key + '.jpg');
    fd.append('acl', 'public-read');
    fd.append('Content-Type', 'image/jpeg');
    fd.append('AWSAccessKeyId', options.key);
    fd.append('policy', options.policy);
    fd.append('signature', options.signature);
    fd.append('file', byteArray);
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
          console.log(media.data);
          var byteArray = Base64Binary.decodeArrayBuffer(media.data);  
          var fd = createFormData(file,  options, byteArray);
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