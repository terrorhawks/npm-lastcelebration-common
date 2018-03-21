angular.module('common.directives', []); 
angular.module('common.filters', []); 
angular.module('common.resources', []); 
angular.module('common.services', []); 

angular.module('common.services')

.factory('Account', ['$q', '$http', 'domainName', function($q, $http, domainName) {
return {
  changePassword: function (password, password_confirmation) {
    return $http({
      url: domainName + '/api/accounts',
      method: "POST",
      dataType: 'json',
      data: {password: password,
             password_confirmation: password_confirmation},
      params: {'change_password': true},
      headers: {
        "Content-Type": "application/json"
      }
    });
  },

  resetPassword: function (email) {
    return $http({
      url: domainName + '/api/accounts',
      method: "POST",
      dataType: 'json',
      data: {email: email},
      params: {'reset_password': true},
      headers: {
        "Content-Type": "application/json"
      }
    });
  }
};
}]);
angular.module('common.services')

.factory('authInterceptor', ['appVersion', 'companyRef','$hyperfoodstorage', '$rootScope', '$q', '$window', 'domainName', 'companyUUID', '$localStorage', function(appVersion, companyRef, $hyperfoodstorage, $rootScope, $q, $window, domainName, companyUUID, $localStorage) {
    
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
          if (appVersion) {
            config.headers['X-APP-VERSION'] = appVersion;
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
      if (rejection) {
        if (rejection.status === 401) {
          $hyperfoodstorage.setObject(CACHE_TOKEN);
          $hyperfoodstorage.setObject(CACHE_EMAIL);
          $hyperfoodstorage.setObject(CACHE_COMPANY_UUID);
          $rootScope.authenticatedUser = undefined;
          delete $localStorage.authenticatedUser;
        }
        if (rejection.status === 408) {
          console.log("Timeout!!!!!!!!!!!!");
        }
        if (rejection.status === 404 || rejection.status === 403) {
          $rootScope.$broadcast("redirect:home");
        }
      }
      return $q.reject(rejection);
    }
  };
}]);
angular.module('common.services')

.factory('AuthenticationService', ['companyRef', '$hyperfoodstorage', '$localStorage', 'Facebook', '$rootScope', '$http', 'domainName', '$q', '$window', 'Auth', '$state', '$timeout', function(companyRef, $hyperfoodstorage, $localStorage, Facebook, $rootScope, $http, domainName, $q, $window, Auth, $state, $timeout) {

	var CACHE_TOKEN =           companyRef + '.userAuth.token';
	var CACHE_EMAIL =           companyRef + '.userAuth.email';
	var CACHE_FB    =           companyRef + '.userAuth.fb';
	var CACHE_COMPANY_UUID =    companyRef + '.userAuth.company';
	var CACHE_FACEBOOK_TOKEN =  companyRef + '.userAuth.facebook';

	var createAuthTokens = function (user) {
		$hyperfoodstorage.setObject(CACHE_TOKEN, user.token);
		$hyperfoodstorage.setObject(CACHE_EMAIL, user.email);
		if (user.facebook) {
			$hyperfoodstorage.setObject(CACHE_FB, user.facebook.id);
		}
		if (user.company) $hyperfoodstorage.setObject(CACHE_COMPANY_UUID, user.company.uuid);
		
		// $window.sessionStorage.token = user.token;
        // $window.sessionStorage.email = user.email;
        // if (user.company) $window.sessionStorage.companyUUID = user.company.uuid;
     	$rootScope.authenticatedUser = user;
     	$localStorage.authenticatedUser = user;
     };

     var removeAuthTokens = function () {
     	$hyperfoodstorage.setObject(CACHE_TOKEN);
     	$hyperfoodstorage.setObject(CACHE_EMAIL);
     	$hyperfoodstorage.setObject(CACHE_FB);
     	$hyperfoodstorage.setObject(CACHE_COMPANY_UUID);
		// delete $window.sessionStorage.token;
	    // delete $window.sessionStorage.email;
	    // delete $window.sessionStorage.companyUUID;
	    console.log("Destroy current authenticated user");
	    $rootScope.authenticatedUser = undefined;
	    delete $localStorage.authenticatedUser;
     };

    var timeToExpire = 0;
    var cacheTime = 300000; //5mins

	var authenticateFBUser = function(facebookData, authResponse) {
		var q = $q.defer();
	    var authenticatedUser = {
	      first_name:   facebookData.first_name,
	      gender:       facebookData.gender,
	      last_name:    facebookData.last_name,
	      timezone:     facebookData.timezone,
	      updated_time: facebookData.updated_time,
	      locale:       facebookData.locale,
	      id:           facebookData.id,
	      verified:     facebookData.verified,
	      link:         facebookData.link
	    };
	    $http.post(domainName + '/api/oauth/registrations', { 
	      user: { name: facebookData.name, 
	              email: facebookData.email, 
	              token: authResponse.accessToken,
	              expiresIn: authResponse.expiresIn,
	              facebook: authenticatedUser }
	     }).then(function (response) {
	     	var user = response.data.user;
    		createAuthTokens(user);
    		$hyperfoodstorage.setObject(CACHE_FACEBOOK_TOKEN, authResponse.accessToken);
			console.log("facebook auth", JSON.stringify(response));
			// $window.sessionStorage.facebookToken = authResponse.accessToken;
         	$rootScope.$broadcast('event:auth', user);  
	        q.resolve(user); 
	     }, function(e) {
	     	q.reject(e);
	     });
	     return q.promise;
	};

	var facebookMe = function (deferred, successSignin) {
		Facebook.me().then(function (user) {
			console.log("facebookMe user", JSON.stringify(user));
	    	authenticateFBUser(user, successSignin.authResponse).then(function (user) {
	    		console.log("authenticateFBUser", JSON.stringify(user));
	    		deferred.resolve(user);
	    	}, function (e) {
	    		console.log("creating user from facebook creds failed" , JSON.stringify(e));
	    		deferred.reject(e);
	    	});		    	
		}, function (e) {
			console.log("accessing 'me' in facebook failed" , JSON.stringify(e));
			deferred.reject(e);
		});	
	};

	var facebookSignin = function (deferred) {
		console.log("Facebook sign-in");
		Facebook.login()
	    	.then(function(success) {
		      console.log("logged in", success);
		      facebookMe(deferred, success);
		    }, function (e) {
		      console.log("logged in failed", JSON.stringify(e));
		      deferred.reject(e);
		});
		$timeout(function () {
			if (deferred.promise.$$state.status === 0) {
				deferred.reject("Unable to authenticate with facebook, please try again");
			}
		}, 30000);
	};

	var facebookLogout = function () { 
		var q = $q.defer();
		console.log("Facebook logout");
		Facebook.loginStatus().then(function (response) {
			console.log(response);
			if (!response.authResponse) {
				$hyperfoodstorage.setObject(CACHE_FACEBOOK_TOKEN);
				// delete $window.sessionStorage.facebookToken;
				q.reject();
			}
			Facebook.logout().then( function() {
	    		console.log("Successful facebook logout");
	      		q.resolve();
	    	}, function(e) {
	    		console.log("Unsuccessful facebook logout", JSON.stringify(e));
	      		q.reject(e);
	    	}).finally(function () {
	    		$hyperfoodstorage.setObject(CACHE_FACEBOOK_TOKEN);
	    		// delete $window.sessionStorage.facebookToken;
	    	});
		}, function (e) {
			console.log("Unsuccessful facebook logout, not logged in", JSON.stringify(e));
		});
		return q.promise; 
	};

	var appLogout = function (deferred) {
		console.log("App logout");
		Auth.logout().then(function () {
			console.log("Successful app logout");
     		removeAuthTokens();
			deferred.resolve();
     	}, function (e) {
     		console.log("Unsuccessful app logout");
     		removeAuthTokens();
     		deferred.reject(e);
     	}).finally(function () {
     		$rootScope.$broadcast('event:logout');
     	});
	};


   var deferredLogin = function (whereNext) {
	    var defer = $q.defer();
	    $rootScope.$broadcast('event:login', defer, whereNext);
	    return defer.promise;
   };  

  return {

  	unAuthorisedDeferToLogin: function(event, xhr, deferred) {
	    console.log("unAuthorisedDeferToLogin", event, xhr, deferred, $state, $state.params.whereNext);
	    var whereNext = $state.params.whereNext;
	    if (whereNext === undefined) {
	    	//if no next state defined, then default to current state (incase of auth interception)
	    	whereNext = $state.current.name;
	    }
  		deferredLogin(whereNext).then(function () {
	        // Successfully logged in.
	        // Redo the original request.
	        return $http(xhr.config);
	    }, function (error) {
	    	deferred.reject(error);
	    }).then(function(response) {
	        // Successfully recovered from unauthorized error.
	        // Resolve the original request's promise.
	        deferred.resolve(response);
	    }, function(error) {
	        // There was an error logging in.
	        // Reject the original request's promise.
	        deferred.reject(error);
	    });
  	},

  	setAuthTokens: function (user) {
  		createAuthTokens(user);
  	},

	getAuthenticatedUser: function (unauthorizedScreen) {

        var deferred = $q.defer();
        
        if (unauthorizedScreen && $localStorage.authenticatedUser) {
        	//if in root scope already authenticated
			deferred.resolve($localStorage.authenticatedUser);
        } else if (unauthorizedScreen && Date.now() <= timeToExpire) {	
		 	// if not forcing authentication and check in last x period then reject
			// to avoid lots of requests to server
			deferred.reject();
        } else {
        	$http.get(domainName + '/api/users/current', {interceptAuth: !unauthorizedScreen})
	          .then(function(response) {
	          	console.log(response);
	          	var user = response.data.user;
	          	createAuthTokens(user);
	          	$rootScope.$broadcast('event:auth', user);
	            deferred.resolve(user);
	        }, function (error) {
	        	timeToExpire = new Date(Date.now() + cacheTime).getTime();
	            deferred.reject(error);
	            console.log("Error getAuthenticatedUser", JSON.stringify(error));
	        });	
        }  
        return deferred.promise;
    },

    logout: function () {
    	var deferred = $q.defer();
    	if ($localStorage.authenticatedUser && $localStorage.authenticatedUser.is_facebook_auth) {
    		console.log("facebook logout");
    		facebookLogout().then(function () {
				appLogout(deferred);
    		}, function (e) {
    			appLogout(deferred);
    		});
    	} else {
    		appLogout(deferred);	
    	}
     	return deferred.promise;
    },

    emailLogin: function (login) {
    	var deferred = $q.defer();
	    var creds = { email: login.email, password: login.password, rememberMe: 1};
	    Auth.login(creds).then(function(response) {
	    	var user = response.user;
	      	createAuthTokens(user);
			$rootScope.$broadcast('event:auth', user);
	      	deferred.resolve(user);
	    }, function(response) {
	      removeAuthTokens();
	      deferred.reject([response.data.error]);
	    });
		return deferred.promise;
    },

    updateUser: function (user) {
    	if (user) {
    		$rootScope.authenticatedUser = user;
    		$localStorage.authenticatedUser = user;
    	}
    },

    refreshAuthenticatedUser: function() {
    	//rsync rootScope after refresh
    	$rootScope.authenticatedUser = $localStorage.authenticatedUser;
    },

    removeTokensAndCachedUser: function () {
		removeAuthTokens();
    },

	facebookLogin: function () {
		console.log("facebook login");
		var deferred = $q.defer();
		console.log("call FB loginStatus", Facebook);

	    var timeoutPromise = $timeout(function() {
	      loginStatus.reject(); //aborts the request when timed out
	      console.log("Timed out");
	    }, 5000); //we set a timeout for 250ms and store the promise in order to be cancelled later if the data does not arrive within 250ms


		var loginStatus = Facebook.loginStatus();
		console.log("call FB loginStatus callback", JSON.stringify(loginStatus));
		loginStatus.then(function (response) {
			$timeout.cancel(timeoutPromise);
			try {
				console.log("loginStatus callback!");
				if (response.status === 'connected') {
					console.log("facebook already logged in " , response);
					facebookMe(deferred, response);
				} else {
					console.log("Facebook, not logged-in");
					facebookSignin(deferred);
				}

			} catch (e) {
				console.error("Failed to check login status", JSON.stringify(e));
			}	 
		}, function (e) {
			$timeout.cancel(timeoutPromise);
			console.log("Facebook, login failing", e);
			deferred.reject(e);
		});
		
		return deferred.promise;
	}

  };

 }]);
angular.module('common.services')

.factory('$hyperfoodstorage', ['$window', 'appVersion', function($window, appVersion) {
  
  //private
  var getObjectFromStorage = function(key) {
      var cached_object = $window.localStorage[key];
      if (cached_object) {
        try {
          return JSON.parse(cached_object);
        } catch (exception) {
          console.log(exception);
          return undefined;
        }
      } else {
        return undefined;
      }
  };

  return {
    
    set: function(key, value) {
      key = key + appVersion;
      if (value) {
        $window.localStorage[key] = value;
      } else {
        $window.localStorage.removeItem(key);
      }
    },

    get: function(key, defaultValue) {

      return $window.localStorage[(key + appVersion)] || (defaultValue + appVersion);
    },

    setObject: function(key, value, cacheTime) {
      if (value) {
        if (cacheTime && cacheTime>0) {
            var timeToExpire = new Date(Date.now() + cacheTime).getTime();
            var cacheTimeKey = key + ".cacheTime" + appVersion;
            console.log("setting cache time to ", timeToExpire);
            $window.localStorage[cacheTimeKey] = timeToExpire;
        }
        console.log("storing object in cache with key", (key + appVersion));
        $window.localStorage[key + appVersion] = JSON.stringify(value);
      } else {
        $window.localStorage.removeItem((key + appVersion));
      }
    },

    clear: function() {
      console.log("WARNING: clearing cache");
      $window.localStorage.clear();
    },

    getObject: function(key, checkCacheExpiry) {
      if (checkCacheExpiry) {
        var cacheTimeKey = key + ".cacheTime" + appVersion;
        var timeToExpire = $window.localStorage[cacheTimeKey];
        var timenow = Date.now();
        if (timenow <= timeToExpire) {
          console.log("not expired yet, get from cache with key", key + appVersion);
          return getObjectFromStorage(key + appVersion);
        }  else {
          console.log("cache expired for key", key + appVersion);
          //lets avoid this to allow stale items to still be used in an emergency!
          //$window.localStorage.removeItem(key + appVersion);
          return undefined;
        }
      } else {
        console.log("get object without checking cache time with key", key + appVersion);
        return getObjectFromStorage(key + appVersion);
      }
    }
  };

}]);
angular.module('common.services')

.factory('Location', ['$q', '$http', 'domainName', function($q, $http, domainName) {
 
  return {
    getClosestPostcode: function(latitude, longitude) {
      return $http({
        url: domainName + '/api/locations', 
        method: "GET",
        params: {latitude: latitude, longitude: longitude}
      });
    }

  };
}]);
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
        console.log("createFormData", key, JSON.stringify(options), "is blob?", is_blob);
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

    function base64DataURItoBlob(dataURI) {

        var byteString;
        var arrayBuffer;
        var intArray;
        var i;
        var mimeString;
        var bb;

        if (dataURI.split(',')[0].indexOf('base64') >= 0) {
            // Convert base64 to raw binary data held in a string:
            byteString = atob(dataURI.split(',')[1]);
        } else {
            // Convert base64/URLEncoded data component to raw binary data:
            byteString = decodeURIComponent(dataURI.split(',')[1]);
        }
        // Write the bytes of the string to an ArrayBuffer:
        arrayBuffer = new ArrayBuffer(byteString.length);
        intArray = new Uint8Array(arrayBuffer);
        for (i = 0; i < byteString.length; i += 1) {
            intArray[i] = byteString.charCodeAt(i);
        }
        // Separate out the mime component:
        mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
        // Write the ArrayBuffer (or ArrayBufferView) to a blob:
        return new Blob([intArray],{type: mimeString});
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

        base64DataURItoBlob: function (dataURI) {
            return base64DataURItoBlob(dataURI);
        },
        
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
angular.module('common.resources')

.factory('Beacon', ['$resource', 'domainName', function ($resource, domainName) {

  return  $resource(domainName + '/api/beacons/:id', { id: '@id' }, {

    create: {
      method: 'POST'
    },
    
    query: {
      isArray: true
    }

  });

}]);
angular.module('common.resources')

.factory('Category', ['$resource', 'domainName','Product', 'ProductOptionGroup', function ($resource, domainName, Product, ProductOptionGroup) {

   var transformer = function(data, header) {
        var category, product, optionGroup;

        category = angular.fromJson(data);

        if (category.products) {
          var products = [];
          angular.forEach(category.products, function (product) {
            product = new Product(product);
            if (product.optionGroups) {
              var optionGroups = [];
              angular.forEach(product.optionGroups, function (optionGroup) {
                optionGroup = new ProductOptionGroup(optionGroup);
                optionGroups.push(optionGroup);
              });
              product.optionGroups = optionGroups;
            }
            products.push(product);
          });
          category.products = products;
        }
        return category;
    };


  return  $resource(domainName + '/api/dashboard/categories/:id', { id: '@id' }, {

    create: {
      method: 'POST',
      transformResponse: transformer
    },

    update: {
      method: 'PUT',
      transformResponse: transformer
    },
    
    query: {
      isArray: true
    },

    get: {
      transformResponse: transformer
    },

    delete: {
      method: 'DELETE',
      transformResponse: transformer
    }

  });

}]);
angular.module('common.resources')

.factory('Company', ['$resource', 'domainName', function ($resource, domainName) {

  return  $resource(domainName + '/api/companies/:id', { id: '@id' }, {

    query: {
      isArray: true
    }

  });

}]);
angular.module('common.resources')

.factory('Menu', ['$resource', 'domainName', 'Category', 'Product', 'ProductOptionGroup', function ($resource, domainName, Category, Product, ProductOptionGroup) {

    var transformer = function(data, header) {
        var category, product, optionGroup;

        data = angular.fromJson(data);

        if (data.categories) {
          var categories = [];
          angular.forEach(data.categories, function (category) {
            category = new Category(category);
            if (category.products) {
              var products = [];
              angular.forEach(category.products, function (product) {
                product = new Product(product);
                if (product.optionGroups) {
                  var optionGroups = [];
                  angular.forEach(product.optionGroups, function (optionGroup) {
                    optionGroup = new ProductOptionGroup(optionGroup);
                    optionGroups.push(optionGroup);
                  });
                  product.optionGroups = optionGroups;
                }
                products.push(product);
              });
              category.products = products;
            }
            categories.push(category);
          });
          data.categories = categories;
        }
        return data;
    };

    return $resource(domainName + '/api/dashboard/menus/:id', { id: '@id' }, {

    create: {
      method: 'POST',
      transformResponse: transformer
    },

    update: {
      method: 'PUT',
      transformResponse: transformer
    },
    
    query: {
      isArray: true
    },

    get: {
      transformResponse: transformer
    },

    delete: {
      method: 'DELETE',
      transformResponse: transformer
    }

  });

}]);
angular.module('common.resources')

.factory('Message', ['$resource', 'domainName', function ($resource, domainName) {

  return  $resource(domainName + '/api/messages/:messageId', { proposition_id: '@proposition_id' }, {
    query: {
      isArray: true
    },
    save: {
      method: 'POST'
    }
  });
}]);
angular.module('common.resources')

.factory('Offer', ['$resource', 'domainName', function ($resource, domainName) {

  return  $resource(domainName + '/api/offers/:id', { id: '@id' }, {

    create: {
      method: 'POST'
    },

    update: {
      method: 'PUT'
    },
    
    query: {
      isArray: true
    }

  });

}]);
angular.module('common.resources')

.factory('OfferProfile', ['$resource', 'domainName', function ($resource, domainName) {

  return  $resource(domainName + '/api/offers_profile/:id', { id: '@id' }, {

    create: {
      method: 'POST'
    },

    update: {
      method: 'PUT'
    },
    
    query: {
      isArray: true
    }

  });

}]);
angular.module('common.resources')

.factory('Order', ['$resource', 'domainName', function ($resource, domainName) {

  return  $resource(domainName + '/api/ecommerce/orders/:id', { id: '@id' }, {

    create: {
      method: 'POST'
    },
    
    query: {
      isArray: false
    },

    query_dashboard: {
    	isArray: true
    }

  });

}]);
angular.module('common.resources')

.factory('Payment', ['$resource', 'domainName', function ($resource, domainName) {

  return  $resource(domainName + '/api/payments/:id', { id: '@id' }, {

    create: {
      method: 'POST'
    }

  });

}]);
angular.module('common.resources')

.factory('Product', ['$resource', 'domainName', function ($resource, domainName) {

  return  $resource(domainName + '/api/dashboard/products/:id', { id: '@id' }, {

    create: {
      method: 'POST'
    },

    update: {
      method: 'PUT'
    },
    
    query: {
      isArray: true
    },

    delete: {
      method: 'DELETE'
    }

  });

}]);
angular.module('common.resources')

.factory('ProductOptionGroup', ['$resource', 'domainName', function ($resource, domainName) {

  return  $resource(domainName + '/api/dashboard/product_option_groups/:id', { id: '@id' }, {

    create: {
      method: 'POST'
    },

    update: {
      method: 'PUT'
    },
    
    query: {
      isArray: true
    },

    delete: {
      method: 'DELETE'
    }

  });

}]);
angular.module('common.resources')

.factory('PropositionMedia', ['$resource', 'domainName', function ($resource, domainName) {

  return  $resource(domainName + '/api/proposition_media/:propositionMediaId', { proposition_id: '@proposition_id' }, {
    query: {
      isArray: true
    },
    save: {
      method: 'POST'
    }
  });
}]);
angular.module('common.resources')

.factory('Requisition', ['$resource', 'domainName', function ($resource, domainName) {

  return  $resource(domainName + '/api/requisitions/:id', { id: '@id' }, {

    create: {
      method: 'POST'
    },

    update: {
      method: 'PUT'
    },
    
    query: {
      isArray: true 
    }

  });

}]);
angular.module('common.resources')

.factory('Site', ['$resource', 'domainName', function ($resource, domainName) {

  return  $resource(domainName + '/api/sites/:id', { id: '@id' }, {

    create: {
      method: 'POST'
    },

    update: {
      method: 'PUT'
    },
    
    query: {
      isArray: true
    }

  });

}]);
angular.module('common.resources')

.factory('Track', ['$resource', 'domainName', function ($resource, domainName) {

  return  $resource(domainName + '/api/tracks/:id', { id: '@id' }, {

    create: {
      method: 'POST'
    },
    
    query: {
      isArray: true
    }

  });

}]);
angular.module('common.resources')

.factory('User', ['$resource', 'domainName', function ($resource, domainName) {

  return  $resource(domainName + '/api/users/:id', { id: '@id' }, {

    create: {
      method: 'POST'
    },

    update: {
      method: 'PUT'
    },
    
    query: {
      isArray: true 
    }

  });

}]);
angular.module('common.directives')
  .directive('upcase', function() {
    return {
     require: 'ngModel',
     link: function(scope, element, attrs, modelCtrl) {
        var capitalize = function(inputValue) {
           if(inputValue === undefined) inputValue = '';
           var capitalized = inputValue.toUpperCase();
           if(capitalized !== inputValue) {
              modelCtrl.$setViewValue(capitalized);
              modelCtrl.$render();
           }         
           return capitalized;
         };
         modelCtrl.$parsers.push(capitalize);
         capitalize(scope[attrs.ngModel]);  // capitalize initial value
     }
   };
})


.directive("fileread", [function () {
    return {
        scope: {
            fileread: "="
        },
        link: function (scope, element, attributes) {
            element.bind("change", function (changeEvent) {
                var reader = new FileReader();
                reader.onload = function (loadEvent) {
                    scope.$apply(function () {
                        scope.fileread = loadEvent.target.result;
                    });
                };
                reader.readAsDataURL(changeEvent.target.files[0]);
            });
        }
    };
}])

.directive('formatPostcode', function($filter, $browser) {
    return {
        require: 'ngModel',
        link: function($scope, $element, $attrs, ngModelCtrl) {
            var listener = function() {
              var value = $element.val();
              if (value) {
                $element.val($filter('postcode')(value, true));
              }
            };
            
            // // This runs when we update the text field
            ngModelCtrl.$parsers.push(function(viewValue) {
                 return viewValue;
            });
            
            // This runs when the model gets updated on the scope directly and keeps our view in sync
            ngModelCtrl.$render = function() {
                $element.val($filter('postcode')(ngModelCtrl.$viewValue, true));

            };
            
            $element.bind('change', listener);
            // $element.bind('keydown', function(event) {
            //     var key = event.keyCode;
            //     // If the keys include the CTRL, SHIFT, ALT, or META keys, or the arrow keys, do nothing.
            //     // This lets us support copy and paste too
            //     if (key == 91 || (15 < key && key < 19) || (37 <= key && key <= 40)) return; 
            //     $browser.defer(listener); // Have to do this or changes don't get picked up properly
            // });
            
            $element.bind('paste cut', function() {
                $browser.defer(listener);
            });
        }
        
    };
})

.directive('match',  function match ($parse) {
    return {
        require: '?ngModel',
        restrict: 'A',
        link: function(scope, elem, attrs, ctrl) {
            if(!ctrl) {
                if(console && console.warn){
                    console.warn('Match validation requires ngModel to be on the element');
                }
                return;
            }

            var matchGetter = $parse(attrs.match);

            scope.$watch(getMatchValue, function(){
                ctrl.$$parseAndValidate();
            });

            ctrl.$validators.match = function(){
                return ctrl.$viewValue === getMatchValue();
            };

            function getMatchValue(){
                var match = matchGetter(scope);
                if(angular.isObject(match) && match.hasOwnProperty('$viewValue')){
                    match = match.$viewValue;
                }
                return match;
            }
        }
    };
})


.directive('thumbnail', function ($timeout, awsImageUploadBucket) {
  return {
    restrict: 'A', 
    scope: {
      thumbnail: '='
    },
    link: function(scope, element, attrs) {
        var count = 0;
        var refreshAfter = function(file_uri, milliseconds) {
              $timeout(function () {
                element.attr("src", file_uri);
                if (count >= 3) {
                    element.unbind('error');
                    element.attr("src","img/user.png");
                } else {
                    count++;
                }
            }, milliseconds);
        };
        var updateImageToThumbnail = function (file_uri) {
              var thumbnail_file_uri = file_uri.replace(awsImageUploadBucket, awsImageUploadBucket + "resized").replace(".jpg", "75x75.jpg");  
              element.attr("src", thumbnail_file_uri); 
              element.bind('error', function() {
                element.attr("src","img/image_loading_spinner.gif");
                refreshAfter(thumbnail_file_uri, 2000 );
              });
        };
        if (scope.thumbnail) {
            updateImageToThumbnail(scope.thumbnail);
        }
    }   
   };
})

.directive('booking', function($state, $stateParams, Offer, $hyperfoodstorage) {
    return {
      restrict: 'A',
      link: function ($scope, element) {
        element.bind('click', function () {
          var propositionId = $hyperfoodstorage.get('currentPropositionId');
          Offer.query({proposition_id: propositionId}, function (offers) {
            if (offers.length == 1) {
              var offer = offers[0];
              $hyperfoodstorage.setObject('offer', offer);
              $state.go('youthfully.booking', {offerId: offer.id});
            } else if (offers.length > 1) {
              $hyperfoodstorage.setObject('offers', offers);
              $state.go('youthfully.offers');
            } else {
              //shouldn't need this situation as we should hide the book button
            }
          });
        });
      }
    };
});
angular.module('common.filters')
   /*Cuts from string piece with specified length*/
    .filter('cut', function () {
        return function (value, wordwise, max) {
            if (!value) return '';

            max = parseInt(max, 10);
            if (!max) return value;
            if (value.length <= max) return value;

            value = value.substr(0, max);
            if (wordwise) {
                var lastspace = value.lastIndexOf(' ');
                if (lastspace != -1) {
                    value = value.substr(0, lastspace);
                }
            }

            return value + '…';
        };
    })

    .filter('postcode', function () {
        return function (value) {
            if (!value) {
              return '';
            } else {
              var value_to_change = value.replace(/\s/g, '');
              if (value_to_change.length===6) {
                return value_to_change.replace(/(.{3})/g, '$1 ').replace(/(^\s+|\s+$)/,'');
              } else if (value_to_change.length===7) {
                return value_to_change.replace(/(.{4})/g, '$1 ').replace(/(^\s+|\s+$)/,'');
              } else {
                return value;
              }
            }
        };
    })

    .filter('requisitionstatus', function () {
        return function (value) {
            if (!value) {
              return '';  
          } else if (value==='assigned') {
            return "Awaiting response";
          } else if (value==='in_progress') {
            return "In conversation";
          } else if (value==='booked') {
            return "Booked";
          } else if (value==='closed') {
            return "Closed";
          }
        };
    })

    .filter('smartCurrency', ['$filter',  function($filter) {
        return function(amount, currencyCode) {
            if(amount) {
                return $filter('isoCurrency')(amount, currencyCode).replace('.00', '');
            }
        };
    }])

    .filter('appCurrency', ['$filter', function ($filter) {
        return function(amount, currencyCode) {
            if (amount) {
                var drivenToPound = parseInt(amount) / 100;
                return $filter('smartCurrency')(drivenToPound, currencyCode);
            }
        };
    }]);