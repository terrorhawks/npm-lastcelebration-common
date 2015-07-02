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