angular.module('common.services')

.factory('Clover', ['$q', '$http', 'domainName', function($q, $http, domainName) {

    return {

        items: function () {
            var deferred = $q.defer();
            $http.get(domainName + '/api/ecommerce/inventory')
                .success(function(response) {
                    deferred.resolve(response);
                })
                .error(function (error, status) {
                    deferred.reject(error);
                });
            return deferred.promise;
        },

        config: function (){
            var deferred = $q.defer();
            $http.get(domainName + '/api/ecommerce/config')
                .success(function(response) {
                    deferred.resolve(response);
                })
                .error(function (error, status) {
                    deferred.reject(error);
                });
            return deferred.promise;
        },
        lastOrder: function (id){
            var deferred = $q.defer();
            $http.get(domainName + '/api/ecommerce/orders/' + id)
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