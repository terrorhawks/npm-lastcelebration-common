angular.module('common.services')

// .constant('ecommerceInit', function($q, Clover) {

//         return function($q) {
//             console.log("ecommerceInit");
//             var deferred = $q.defer();
//             console.log("clover setup");
//             Clover.setUp(deferred);
//             return deferred.promise;
//         };
// })

.factory('Clover', ['$q', '$http', 'domainName', '$localstorage', function($q, $http, domainName, $localstorage) {

    var storeInCache = function (key, items) {
        $localstorage.setObject(key, items);
    };

    var getFromCache = function (key) {
        return $localstorage.getObject(key);
    };

    var getItemsFromServer = function () {
        var deferred = $q.defer();
        $http.get(domainName + '/api/ecommerce/inventory')
            .success(function(response) {
                deferred.resolve(response);
            })
            .error(function (error, status) {
                deferred.reject(error);
            });
        return deferred.promise;
    };

    var getConfigFromServer = function () {
        var deferred = $q.defer();
        $http.get(domainName + '/api/ecommerce/config')
            .success(function(response) {
                deferred.resolve(response);
            })
            .error(function (error, status) {
                deferred.reject(error);
            });
        return deferred.promise;
    };

    var getItems = function () {
        console.log("ecommerce items");
        var deferred = $q.defer();
        var key = 'ecommerce_items';
        var items_from_cached = getFromCache(key);
        if (items_from_cached===undefined) {
           getItemsFromServer().then(function (items) {
                storeInCache(key, items);
                deferred.resolve(items);
           }, function (e) {
                deferred.reject(e);
           });
        } else {
            deferred.resolve(items_from_cached);
        }
        return deferred.promise;
    };

    var getConfig = function () {
        console.log("ecommerce config");
        var deferred = $q.defer();
        var key = 'ecommerce_config';
        var config_from_cached = getFromCache(key);
        if (config_from_cached===undefined) {
           getConfigFromServer().then(function (ecommerce_config) {
                storeInCache(key, ecommerce_config);
                deferred.resolve(ecommerce_config);
           }, function (e) {
                deferred.reject(e);
           });
        } else {
            deferred.resolve(config_from_cached);
        }
        return deferred.promise;
    };

    var getItemsForCategory = function (category) {
        var deferred = $q.defer();
        getItems().then(function (items) {
            if (items) {
                deferred.resolve(items[category]);
            }
        }, function (e) {
            deferred.reject(e);
        });
        return deferred.promise;
    };

    var getItemsForSubCategory = function (category, subCategory) {
        var deferred = $q.defer();
        getItemsForCategory(category).then(function (items_for_category) {
            if (items_for_category) {
                deferred.resolve(items_for_category[subCategory]);
            }
        }, function (e) {
            deferred.reject(e);
        });
        return deferred.promise;
    };

    return {

        setUp: function (deferred) {
          $q.all([getConfig(), getItems()]).then(function() {
            deferred.resolve();
          });
        },

        itemsForCategory: function (category) {
           return getItemsForCategory(category);
        },

        itemsForSubCategory: function (category, subCategory) {
            return getItemsForSubCategory(category, subCategory);
        },

        item: function (category, subCategory, id) {
            var deferred = $q.defer();
            getItemsForSubCategory(category, subCategory).then(function (items) {
                angular.forEach(items, function (item) {
                    if (item.id === id) {
                        deferred.resolve(item);
                    }
                });
            }, function (e) {
                deferred.reject(error);
            });
            return deferred.promise;
        },

        items: function () {
            return getItems();
        },

        config: function () {
            return getConfig();  
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
