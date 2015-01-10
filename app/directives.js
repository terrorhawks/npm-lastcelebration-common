angular.module('common.directives')
  .directive('upcase', function() {
    return {
     require: 'ngModel',
     link: function(scope, element, attrs, modelCtrl) {
        var capitalize = function(inputValue) {
           if(inputValue === undefined) inputValue = '';
           var capitalized = inputValue.toUpperCase();
           if(capitalized !== inputValue) {
              modelCtrl.$setViewValue(capitalized);
              modelCtrl.$render();
           }         
           return capitalized;
         };
         modelCtrl.$parsers.push(capitalize);
         capitalize(scope[attrs.ngModel]);  // capitalize initial value
     }
   };
})

  .directive('autoGrow', function() {
    return function(scope, element, attr){
      var minHeight = element[0].offsetHeight,
        paddingLeft = element.css('paddingLeft'),
        paddingRight = element.css('paddingRight');
   
      var $shadow = angular.element('<div></div>').css({
        position: 'absolute',
        top: -10000,
        left: -10000,
        width: element[0].offsetWidth - parseInt(paddingLeft || 0) - parseInt(paddingRight || 0),
        fontSize: element.css('fontSize'),
        fontFamily: element.css('fontFamily'),
        lineHeight: element.css('lineHeight'),
        resize:     'none'
      });
      angular.element(document.body).append($shadow);
   
      var update = function() {
        var times = function(string, number) {
          for (var i = 0, r = ''; i < number; i++) {
            r += string;
          }
          return r;
        };
   
        var val = element.val().replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/&/g, '&amp;')
          .replace(/\n$/, '<br/>&nbsp;')
          .replace(/\n/g, '<br/>')
          .replace(/\s{2,}/g, function(space) { return times('&nbsp;', space.length - 1) + ' '; });
        $shadow.html(val);
   
        element.css('height', Math.max($shadow[0].offsetHeight + 10 /* the "threshold" */, minHeight) + 'px');
      };
   
      element.bind('keyup keydown keypress change', update);
      update();
    };
  })


.directive('basesrc', function ($http) {
  return {
    restrict: 'A', 
    scope: {
      basesrc: '=',
    },
    link: function($scope, element, attrs) {
       if ($scope.basesrc) {
         $http.get($scope.basesrc).then(function (response) {
          element.attr("src", "data:image/png;base64," + response.data);
         });      
       } else {
         element.attr("src", "img/user.png");
       }
    }
   };
})

.directive('match', function() {
  return {
    require: 'ngModel',
    link: function(scope, elm, attrs, ctrl) {
      ctrl.$parsers.unshift(function(viewValue) {
        if (viewValue === scope[attrs.match]) {
          ctrl.$setValidity('sameAs', true);
          return viewValue;
        } else {
          ctrl.$setValidity('sameAs', false);
          return undefined;
        }
      });
    }
  };
})

.directive('booking', function($state, $stateParams, Offer, $localstorage) {
    return {
      restrict: 'A',
      link: function ($scope, element) {
        element.bind('click', function () {
          Offer.query({proposition_id: $stateParams.propositionId}, function (offers) {
            if (offers.length == 1) {
              $localstorage.setObject('offer', offers[0]);
              $state.go('youthfully.booking', {offerId: offer.id});
            } else if (offers.length > 1) {
              $localstorage.setObject('offers', offers);
              $state.go('youthfully.offers');
            } else {
              //toast message
            }
          });
        });
      }
    };
});