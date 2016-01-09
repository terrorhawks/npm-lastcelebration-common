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