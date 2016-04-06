angular.module('common.services')

.factory('AuthenticationService', ['companyRef', '$hyperfoodstorage', '$localStorage', 'Facebook', '$rootScope', '$http', 'domainName', '$q', '$window', 'Auth', '$state', '$timeout', function(companyRef, $hyperfoodstorage, $localStorage, Facebook, $rootScope, $http, domainName, $q, $window, Auth, $state, $timeout) {

	var CACHE_TOKEN =           companyRef + '.userAuth.token';
	var CACHE_EMAIL =           companyRef + '.userAuth.email';
	var CACHE_COMPANY_UUID =    companyRef + '.userAuth.company';
	var CACHE_FACEBOOK_TOKEN =  companyRef + '.userAuth.facebook';

	var createAuthTokens = function (user) {
		$hyperfoodstorage.setObject(CACHE_TOKEN, user.token);
		$hyperfoodstorage.setObject(CACHE_EMAIL, user.email);
		if (user.company) $hyperfoodstorage.setObject(CACHE_COMPANY_UUID, user.company.uuid);
		
		// $window.sessionStorage.token = user.token;
        // $window.sessionStorage.email = user.email;
        // if (user.company) $window.sessionStorage.companyUUID = user.company.uuid;
     	$localStorage.authenticatedUser = user;
     };

     var removeAuthTokens = function () {
     	$hyperfoodstorage.setObject(CACHE_TOKEN);
     	$hyperfoodstorage.setObject(CACHE_EMAIL);
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
        
        if ($localStorage.authenticatedUser) {
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
	          	$rootScope.$broadcast('event:auth', user);
	            createAuthTokens(user);
	            deferred.resolve(user);
	        }, function (error) {
	        	timeToExpire = new Date(Date.now() + cacheTime).getTime();
	            deferred.reject(error);
	            console.log("Error getAuthenticatedUser", JSON.stringify(error));
	            removeAuthTokens();
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

	facebookLogin: function () {
		console.log("facebook login");
		var deferred = $q.defer();
		console.log("call FB loginStatus", Facebook);
		var loginStatus = Facebook.loginStatus();
		console.log("call FB loginStatus callback", JSON.stringify(loginStatus));
		loginStatus.then(function (response) {
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
			console.log("Facebook, login failing", e);
			deferred.reject(e);
		});
		
		return deferred.promise;
	}

  };

 }]);