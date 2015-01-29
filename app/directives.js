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

.directive('postcode', function() {
  return {
    require: 'ngModel',
    link: function(scope, elm, attrs, ctrl) {
      ctrl.$parsers.unshift(function(viewValue) {
        if (!viewValue) {
              return '';  
          } else if (viewValue.length===6) {
            return viewValue.replace(/(.{3})/g, '$1 ').replace(/(^\s+|\s+$)/,'');
          } else if (viewValue.length===7) {
            return viewValue.replace(/(.{4})/g, '$1 ').replace(/(^\s+|\s+$)/,'');
          } else {
            return viewValue;
          }
      });
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

.directive('thumbnail', function ($timeout, awsImageUploadBucket) {
  return {
    restrict: 'A', 
    scope: {
      thumbnail: '=',
    },
    link: function(scope, element, attrs) {
        var count = 0;
        var refreshAfter = function(file_uri, milliseconds) {
              $timeout(function () {
                element.attr("src", file_uri);
                if (count >= 5) {
                    element.unbind('error');
                    element.attr("src","img/user.png");
                } else {
                    count++;
                }
            }, milliseconds);
        };
        var updateImageToThumbnail = function (file_uri) {
              var thumbnail_file_uri = file_uri.replace(awsImageUploadBucket, awsImageUploadBucket + "resized").replace(".jpg", "75x75.jpg");  
              element.attr("src", thumbnail_file_uri); 
              element.bind('error', function() {
                element.attr("src","img/image_loading_spinner.gif");
                refreshAfter(thumbnail_file_uri, 2000 );
              });
        };
        if (scope.thumbnail) {
            updateImageToThumbnail(scope.thumbnail);
        }
    }   
   };
})

.directive('booking', function($state, $stateParams, Offer, $localstorage) {
    return {
      restrict: 'A',
      link: function ($scope, element) {
        element.bind('click', function () {
          var propositionId = $localstorage.get('currentPropositionId');
          Offer.query({proposition_id: propositionId}, function (offers) {
            if (offers.length == 1) {
              var offer = offers[0];
              $localstorage.setObject('offer', offer);
              $state.go('youthfully.booking', {offerId: offer.id});
            } else if (offers.length > 1) {
              $localstorage.setObject('offers', offers);
              $state.go('youthfully.offers');
            } else {
              //shouldn't need this situation as we should hide the book button
            }
          });
        });
      }
    };
});