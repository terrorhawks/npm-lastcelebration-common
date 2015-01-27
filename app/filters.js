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
    });