var s3Service = function($q, $http, domainName, awsImageUploadBucket, uuid4, awsSiteImageUploadBucket) {

    var s3_config;
    var purge_date;
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

    function createFormData(key, options, contents) {
        var fd = new FormData();
        fd.append('key', key);
        fd.append('acl', 'public-read');
        fd.append('Content-Type', 'image/jpeg');
        fd.append('AWSAccessKeyId', options.key);
        fd.append('policy', options.policy);
        fd.append('signature', options.signature);
        fd.append('file', dataURItoBlob(contents));
        return fd;
    }

    function dataURItoBlob(b64Data) {
        var byteCharacters = atob(b64Data);
        var byteNumbers = new Array(byteCharacters.length);
        for (var i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        var byteArray = new Uint8Array(byteNumbers);
        var blob = new Blob([byteArray], {type: 'image/jpeg'});
        return blob;
    }

    function getAWSPolicy(uploaded_from) {
        var deferred = $q.defer();
        if (s3_config && purge_date > new Date().getTime()) {
            deferred.resolve(s3_config);
        } else {
            var uriParams = uploaded_from === 'signup' ? '?signup=true' : '';
            $http.get(domainName + '/api/s3' + uriParams)
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

    function create_folder(identifier, uploaded_from) {
        if (identifier && identifier.indexOf('@') > 0) {
            return sha1(identifier);
        } else if (identifier) {
            if (uploaded_from === 'signup') {
                return sha1(identifier);
            } else {
                return identifier;
            }
        } else {
            return "development";
        }
    }

    function getBucketName(uploaded_from) {
        if (!!uploaded_from && uploaded_from === 'signup') {
            return awsSiteImageUploadBucket;
        } else {
            return awsImageUploadBucket;
        }
    }

    return {
        sha: function(email) {
            return sha1(email);
        },

        upload: function(image_uri, identifier, uploaded_from, croppedName) {
            var deferred = $q.defer();
            getAWSPolicy(uploaded_from).then(function (options) {
                //var s3Uri = 'https://' + getBucketName(uploaded_from) + '.s3.amazonaws.com/';
                var s3Uri = 'http://snaps.youthfully.co.s3.amazonaws.com/';
                var folder = create_folder(identifier, uploaded_from);
                var sizes = croppedName ? croppedName : '';
                var file = folder + '/' + uuid4.generate() + croppedName + '.jpg';
                var file_uri = s3Uri + file;
                var fd = createFormData(file,  options, image_uri);
                postFormData(s3Uri, fd).then(function (response) {
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

};

s3Service.$inject = window.ionic ? ['$q', '$http', 'domainName', 'awsImageUploadBucket', 'uuid4'] : ['$q', '$http', 'domainName', 'awsImageUploadBucket', 'uuid4', 'awsSiteImageUploadBucket'];
angular.module('common.services').factory('S3', s3Service);