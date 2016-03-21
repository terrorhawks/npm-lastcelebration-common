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