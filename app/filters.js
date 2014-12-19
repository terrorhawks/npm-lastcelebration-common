angular.module('common.filters', [])
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
    });