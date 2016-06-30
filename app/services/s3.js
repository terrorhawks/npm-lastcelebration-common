var s3Service = function($q, $http, domainName, awsImageUploadBucket, uuid4) {

    var s3_config;
    var purge_date;
    //cached for 50 seconds
    var ttl_in_ms = 50000;

    function postFormData(uri, formData) {
        return $http.post(uri, formData, {
            transformRequest: angular.identity,
            headers: {'Content-Type': undefined}
        });
    }

    function createFormData(key, options, contents, is_blob) {
        console.log("createFormData", key, JSON.stringify(options));
        var fd = new FormData();
        fd.append('key', key);
        fd.append('acl', 'public-read');
        fd.append('Content-Type', 'image/jpeg');
        fd.append('AWSAccessKeyId', options.key);
        fd.append('policy', options.policy);
        fd.append('signature', options.signature);
        if (is_blob) {
           fd.append('file', contents);
        } else {
           fd.append('file', dataURItoBlob(contents)); 
        }
        return fd;
    }

    // function dataURLtoBlob(dataURI) {

    //     var byteString;
    //     var arrayBuffer;
    //     var intArray;
    //     var i;
    //     var mimeString;
    //     var bb;

    //     if (dataURI.split(',')[0].indexOf('base64') >= 0) {
    //         // Convert base64 to raw binary data held in a string:
    //         byteString = atob(dataURI.split(',')[1]);
    //     } else {
    //         // Convert base64/URLEncoded data component to raw binary data:
    //         byteString = decodeURIComponent(dataURI.split(',')[1]);
    //     }
    //     // Write the bytes of the string to an ArrayBuffer:
    //     arrayBuffer = new ArrayBuffer(byteString.length);
    //     intArray = new Uint8Array(arrayBuffer);
    //     for (i = 0; i < byteString.length; i += 1) {
    //         intArray[i] = byteString.charCodeAt(i);
    //     }
    //     // Separate out the mime component:
    //     mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
    //     // Write the ArrayBuffer (or ArrayBufferView) to a blob:
    //     return new Blob([intArray],{type: mimeString});
    // }

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
                .then(function(response) {
                    s3_config = response;
                    purge_date = new Date().getTime() + ttl_in_ms;
                    deferred.resolve(response);
                }, function (error, status) {
                    deferred.reject(error);
                });
        }
        return deferred.promise;
    }

    function create_folder(identifier) {
        if (identifier) {
            return sha1(identifier);
        } else {
            return "development";
        }
    }

    function getBucketName(uploaded_from) {
        return awsImageUploadBucket;
    }

    return {
        sha: function(email) {
            return sha1(email);
        },

        upload: function(image_uri, identifier, root_folder, uploaded_from, cropped_name, is_blob) {
            if (is_blob === undefined) {
                is_blob = false;
            }
            var deferred = $q.defer();
            if (!root_folder) {
                root_folder = '';
            }
            if (!cropped_name) {
                cropped_name = '';
            }
            getAWSPolicy(uploaded_from).then(function (options) {
                var s3Uri = 'http://' + getBucketName(uploaded_from) + '.s3.amazonaws.com/';
                var folder = create_folder(identifier);
                var sizes = cropped_name;
                var uuid = uuid4.generate();
                var file = root_folder + '/' + folder + '/' +  uuid + cropped_name + '.jpg';
                var file_uri = s3Uri + file;
                console.log("Uploading file to s3.. ", file_uri);
                var fd = createFormData(file,  options.data, image_uri, is_blob);
                console.log("postFormData", s3Uri, JSON.stringify(fd));
                var output = { 
                               uri: file_uri,
                               file:  (uuid + cropped_name + '.jpg'),
                               path:  (root_folder + '/' + folder + '/') 
                             };
                postFormData(s3Uri, fd).then(function (response) {
                    console.log("Successful load to S3", JSON.stringify(response));
                    deferred.resolve(output);
                }, function (error) {
                    // suppress failure, it still works,but a response error is thrown.
                    console.warn("Warning it may have failed to load to S3", JSON.stringify(error));
                    deferred.resolve(output);
                    // deferred.reject(error);
                });
            }, function(error) {
                deferred.reject(error);
            });
            return deferred.promise;
        }
    };

};

s3Service.$inject = ['$q', '$http', 'domainName', 'awsImageUploadBucket', 'uuid4'];
angular.module('common.services').factory('S3', s3Service);