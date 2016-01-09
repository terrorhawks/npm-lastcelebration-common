angular.module('common.directives', []); 
angular.module('common.filters', []); 
angular.module('common.resources', []); 
angular.module('common.services', []); 

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

    .factory('AppConfig', ['$rootScope', '$q', '$localstorage', 'Company', function($rootScope, $q, $localstorage, Company) {

        var APP_COMPANY_KEY = "events.app.company";
        var APP_SITE_KEY = "events.app.site";
        var APP_MENU_KEY = "events.app.menu";

        var millisecondsUntilMidnight = function () {
             var time_now = new Date();
             var time_at_midnight = new Date();
             time_at_midnight.setHours(24,0,0,0);
             return time_at_midnight.getTime() - time_now.getTime();
        };

        var getCompany = function (companyUUID) {
            var deferred = $q.defer();
            var company = $localstorage.getObject(APP_COMPANY_KEY, true);
            if (company) {
                // console.log("Company retrieve from cache.");
                deferred.resolve(company);
            } else {
                getCompanyFromServer(companyUUID, deferred);
            }
            return deferred.promise;
        };

        var refreshCachedSite = function(company) {
            //once you have chosen a site, it will never expire from cache, unless they are not in the latest company json
            var site = getChosenSite();
            if (site !== undefined) {
                var site_found = _.find(company.sites, function(c_site) {
                    c_site.id = site.id;
                });
                // console.log("update site in cache", site_found);
                //if not found, then it will expire the site from the cache, otherwise update it.
                setChosenSite(site_found);
            }
        };

        var getCompanyFromServer = function (companyUUID, deferred) {
                Company.get({uuid: companyUUID}).$promise.then(function (company) {
                    $localstorage.setObject(APP_COMPANY_KEY, company, millisecondsUntilMidnight());
                    refreshCachedSite(company);
                    // console.log("Company retrieve from server and cached.");
                    deferred.resolve(company);
                }, function (error) {
                    console.log("Failed to retrieve company", error);
                    deferred.reject(error);
                });
        };

        var getSite = function(companyUUID) {
            var deferred = $q.defer();
            var chosenSite = getChosenSite();
            if (chosenSite !== undefined) {
                // console.log("site already in cache", chosenSite.name);
                deferred.resolve(chosenSite);
            } else {
                getCompany(companyUUID).then(function (company) {
                    if (company.sites.length === 1) {
                        var site  = company.sites[0];
                        setChosenSite(site);
                        deferred.resolve(site);
                    } else {
                        deferred.reject("Please choose a branch for " + company.brand_name);
                    }
                }, function (error) {
                    deferred.reject(error);
                });    
            }
            return deferred.promise;
        };

        var getChosenSite = function () {
            return $localstorage.getObject(APP_SITE_KEY);
        };

        var setChosenSite = function (site) {
            $localstorage.setObject(APP_SITE_KEY, site);
        };

        var getChosenMenu = function () {
            return $localstorage.getObject(APP_MENU_KEY, true );
        };

        var setChosenMenu = function (menu) {
            // console.log("set menu cache for", millisecondsUntilMidnight(), menu);
            $localstorage.setObject(APP_MENU_KEY, menu, millisecondsUntilMidnight());
        };

        return {

            init: function (companyUUID) {
                var deferred = $q.defer();
                if ($rootScope.company === undefined) {
                    getCompany(companyUUID).then(function (company) {
                        $rootScope.company = company;
                        deferred.resolve(company);
                    }, function (error) {
                        deferred.reject(error);
                    });
                } else {
                    deferred.resolve($rootScope.company);
                }
                if ($rootScope.site === undefined) {
                    getSite(companyUUID).then(function (site) {
                        $rootScope.site = site;
                    }, function (error) {
                        console.log("No site available", error);
                    });
                }
                if ($rootScope.menu === undefined) {
                    $rootScope.menu = getChosenMenu();
                }
                return deferred.promise;    
            },

            menu: function () {
                return getChosenMenu();
            },

            setMenu: function (menu) {
                setChosenMenu(menu);
            },

            company: function (companyUUID) {
                //promise
                return getCompany(companyUUID);
            },

            setSite: function (site) {
                setChosenSite(site);
            },

            site: function (companyUUID) {
                //promise
                return getSite(companyUUID);
            },

            defaultAvatar: function (companyUUID) {
                var deferred = $q.defer();
                getCompany(companyUUID).then(function (company) {
                    deferred.resolve(company.default_avatar_for_consumer);
                }, function () {
                    deferred.reject();
                });
                return deferred.promise;
            }

        };
    }]);
angular.module('common.services')

.factory('authInterceptor', function($rootScope, $q, $window, domainName, companyUUID) {
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
          // mobile apps use pre-configured companyUUID
          config.headers['X-COMPANY-UUID'] = companyUUID;
      } else {
          // dashboard uses companyUUID from authenticated user
          config.headers['X-COMPANY-UUID'] = $window.sessionStorage.companyUUID;
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
angular.module('common.services')

.factory('AuthenticationService', ['Facebook', '$rootScope', '$http', 'domainName', '$q', '$window', 'Auth', function(Facebook, $rootScope, $http, domainName, $q, $window, Auth) {

	var createAuthTokens = function (user) {
		$window.sessionStorage.token = user.token;
     	$window.sessionStorage.email = user.email;
     	if (user.company) $window.sessionStorage.companyUUID = user.company.uuid;
     	$rootScope.authenticatedUser = user;
     };

     var removeAuthTokens = function () {
		 delete $window.sessionStorage.token;
	     delete $window.sessionStorage.email;
	     delete $window.sessionStorage.companyUUID;
	     console.log("Destroy current authenticated user");
	     $rootScope.authenticatedUser = undefined;
     };

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
    		$window.sessionStorage.facebookToken = authResponse.accessToken;
         	$rootScope.$broadcast('event:auth', user);  
	        q.resolve(user); 
	     }, function(e) {
	     	q.reject(e);
	     });
	     return q.promise;
	};

	var facebookMe = function (deferred, successSignin) {
		Facebook.me().then(function (user) {
			console.log("facebookMe user", user);
	    	authenticateFBUser(user, successSignin.authResponse).then(function (user) {
	    		console.log("authenticateFBUser", user);
	    		deferred.resolve(user);
	    	}, function (e) {
	    		console.log("creating user from facebook creds failed" ,e);
	    		deferred.reject(e);
	    	});		    	
		}, function (e) {
			console.log("accessing 'me' in facebook failed" ,e);
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
		      console.log("logged in failed");
		      console.log(e);
		      deferred.reject(e);
		    });
	};

	var facebookLogout = function () { 
		var q = $q.defer();
		console.log("Facebook logout");
		Facebook.loginStatus().then(function (response) {
			console.log(response);
			if (!response.authResponse) {
				delete $window.sessionStorage.facebookToken;
				q.reject();
			}
			Facebook.logout().then( function() {
	    		console.log("Successful facebook logout");
	      		q.resolve();
	    	}, function(e) {
	    		console.log("Unsuccessful facebook logout");
	    		console.log(e);
	      		q.reject(e);
	    	}).finally(function () {
	    		delete $window.sessionStorage.facebookToken;
	    	});
		}, function (e) {
			console.log("Unsuccessful facebook logout, not logged in");
			console.log(e);
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


   var deferredLogin = function () {
	    var defer = $q.defer();
	    $rootScope.$broadcast('event:login', defer);
	    return defer.promise;
   };  

  return {

  	unAuthorisedDeferToLogin: function(event, xhr, deferred) {
  		deferredLogin().then(function () {
	        // Successfully logged in.
	        // Redo the original request.
	        return $http(xhr.config);
	    }, function (error) {
	    	console.log("unAuthorisedDeferToLogin", deferred);
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
        
        if ($rootScope.authenticatedUser) {
        	console.log("already authenticatedUser!!!!!!!!!!!!");
			//if in root scope already authenticated
			deferred.resolve($rootScope.authenticatedUser);
        } else if (unauthorizedScreen) {	
        	console.log("already checked!!!!!!!!!!!!!");
			// if not forcing authentication and check in last x period then reject
			// to avoid lots of requests to server
			deferred.reject();
        } else {
        	console.log("force checked to see if authenticated");

	        $http.get(domainName + '/api/users/current', {interceptAuth: !unauthorizedScreen})
	          .success(function(response) {
	          	var user = response.user;
	          	$rootScope.$broadcast('event:auth', user);
	            createAuthTokens(user);
	            deferred.resolve(user);
	        }).error(function (error, status) {
	            deferred.reject(error);
	            console.log("Error getAuthenticatedUser", error);
	            removeAuthTokens();
	        });	
        }  
        return deferred.promise;
    },

    logout: function () {
    	var deferred = $q.defer();
    	if ($rootScope.authenticatedUser && $rootScope.authenticatedUser.is_facebook_auth) {
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

	facebookLogin: function () {
		console.log("facebook login");
		var deferred = $q.defer();
		
		Facebook.loginStatus().then(function (response) {
			if (response.status === 'connected') {
				console.log("facebook already logged in " , response);
				facebookMe(deferred, response);
			} else {
				console.log("Facebook, not logged-in");
				facebookSignin(deferred);
			}
		}, function (e) {
			console.log("Facebook, login failing", e);
			deferred.reject(e);
		});
		
		return deferred.promise;
	}

  };

 }]);
angular.module('common.services')

.factory('$localstorage', ['$window', function($window) {
  
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
      if (value) {
        $window.localStorage[key] = value;
      } else {
        $window.localStorage.removeItem(key);
      }
    },

    get: function(key, defaultValue) {
      return $window.localStorage[key] || defaultValue;
    },

    setObject: function(key, value, cacheTime) {
      if (value) {
        if (cacheTime && cacheTime>0) {
            var timeToExpire = new Date(Date.now() + cacheTime).getTime();
            var cacheTimeKey = key + ".cacheTime";
            console.log("setting cache time to ", timeToExpire);
            $window.localStorage[cacheTimeKey] = timeToExpire;
        }
        $window.localStorage[key] = JSON.stringify(value);
      } else {
        $window.localStorage.removeItem(key);
      }
    },

    clear: function() {
      $window.localStorage.clear();
    },

    getObject: function(key, checkCacheExpiry) {
      if (checkCacheExpiry) {
        var cacheTimeKey = key + ".cacheTime";
        var timeToExpire = $window.localStorage[cacheTimeKey];
        var timenow = Date.now();
        if (timenow <= timeToExpire) {
          console.log("not expired yet, get from cache");
          return getObjectFromStorage(key);
        }  else {
          console.log("cache expired for key", key);
          //lets avoid this to allow stale items to still be used in an emergency!
          //$window.localStorage.removeItem(key);
          return undefined;
        }
      } else {
        return getObjectFromStorage(key);
      }
      
    }
  };

}]);
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

    function create_folder(identifier) {
        if (identifier) {
            return sha1(identifier);
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

        upload: function(image_uri, identifier, root_folder, uploaded_from, cropped_name) {
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
                var file = root_folder + '/' + folder + '/' + uuid4.generate() + cropped_name + '.jpg';
                var file_uri = s3Uri + file;
                console.log("Uploading file to s3.. ", file_uri);
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

.factory('Company', ['$resource', 'domainName', function ($resource, domainName) {

  return  $resource(domainName + '/api/companies/:id', { id: '@id' }, {

    query: {
      isArray: true
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

.directive('booking', function($state, $stateParams, Offer, $localstorage) {
    return {
      restrict: 'A',
      link: function ($scope, element) {
        element.bind('click', function () {
          var propositionId = $localstorage.get('currentPropositionId');
          Offer.query({proposition_id: propositionId}, function (offers) {
            if (offers.length == 1) {
              var offer = offers[0];
              $localstorage.setObject('offer', offer);
              $state.go('youthfully.booking', {offerId: offer.id});
            } else if (offers.length > 1) {
              $localstorage.setObject('offers', offers);
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

            return value + ' …';
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

    //refactor and remove
  .filter('belairCurrency', ['$filter', function ($filter) {
        return function(amount, currencyCode) {
            if (amount) {
                var drivenToPound = amount / 100;
                return $filter('smartCurrency')(drivenToPound, currencyCode);
            }
        };
    }])

    .filter('appCurrency', ['$filter', function ($filter) {
        return function(amount, currencyCode) {
            if (amount) {
                var drivenToPound = amount / 100;
                return $filter('smartCurrency')(drivenToPound, currencyCode);
            }
        };
    }]);