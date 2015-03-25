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

    var cacheExpires;

    var CACHE_EXPIRES_IN_MS = 60000; //60 seconds

    var ITEMS_CACHE_KEY = 'ecommerce_items';

    var storeInCache = function (key, items) {
        $localstorage.setObject(key, items);
    };

    var getFromCache = function (key) {
        return $localstorage.getObject(key);
    };

    var getItemsFromServer = function () {
        var deferred = $q.defer();
        $http({
            url: domainName + '/api/ecommerce/inventory', 
            method: "GET",
            dataType: 'json',
            data: '',
            interceptAuth: false,
            headers: {
              "Content-Type": "application/json"
            }
        }).success(function(response) {
                console.log(response);
                deferred.resolve(response);
            })
            .error(function (error, status) {
                deferred.reject(error);
            });
        return deferred.promise;
    };

    var getConfigFromServer = function () {
        var deferred = $q.defer();
        $http({
            url: domainName + '/api/ecommerce/config', 
            method: "GET",
            dataType: 'json',
            data: '',
            interceptAuth: false,
            headers: {
              "Content-Type": "application/json"
            }
        }).success(function(response) {
                deferred.resolve(response);
            })
            .error(function (error, status) {
                deferred.reject(error);
            });
        return deferred.promise;
    };

    var getItems = function () {
        
        var deferred = $q.defer();
        var timenow = Date.now();
        var items_from_cached;

        if (cacheExpires!==undefined && timenow <= cacheExpires) {
           items_from_cached = getFromCache(ITEMS_CACHE_KEY);
        }
        
        if (items_from_cached===undefined) {
           
           console.log("Get items from server");
           getItemsFromServer().then(function (items) {
                storeInCache(ITEMS_CACHE_KEY, items);
                cacheExpires = timenow + CACHE_EXPIRES_IN_MS;
                console.log(items);
                deferred.resolve(items);
           }, function (e) {
                deferred.reject(e);
           });

        } else {
            console.log("Get items from cache");
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
                console.log(items[category]);
                deferred.resolve(items[category]);
            } else {
                deferred.reject("Items found found");
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
                console.log(items_for_category[subCategory]);
                deferred.resolve(items_for_category[subCategory]);
            } else {
                deferred.reject("Category not found");
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
            var not_found = true;
            getItemsForSubCategory(category, subCategory).then(function (items) {
                angular.forEach(items, function (item) {
                    console.log(item.id, id);
                    if (item.id.toString() === id) {
                        not_found = false;
                        deferred.resolve(item);
                    }
                });
                if (not_found) {
                    deferred.reject("Item not found " + id);
                }
            }, function (e) {
                deferred.reject(e);
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
