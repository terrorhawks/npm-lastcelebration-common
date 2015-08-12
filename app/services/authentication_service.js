angular.module('common.services')

.factory('AuthenticationService', ['Facebook', '$rootScope', '$http', 'domainName', '$q', '$window', 'Auth', function(Facebook, $rootScope, $http, domainName, $q, $window, Auth) {

	var createAuthTokens = function (user) {
		$window.sessionStorage.token = user.token;
     	$window.sessionStorage.email = user.email;
     	$rootScope.authenticatedUser = user;
     };

     var removeAuthTokens = function () {
		 delete $window.sessionStorage.token;
	     delete $window.sessionStorage.email;
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