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

.directive('formatPostcode', function($filter, $browser) {
    return {
        require: 'ngModel',
        link: function($scope, $element, $attrs, ngModelCtrl) {
            var listener = function() {
               if ($element.val()) {
                $element.val($filter('postcode')(value, false));
              }
            };
            
            // // This runs when we update the text field
            // ngModelCtrl.$parsers.push(function(viewValue) {
            //   if (viewValue) {
            //     return viewValue.replace(/\s/g, '');
            //   } else {
            //     return viewValue;
            //   }
            // });
            
            // This runs when the model gets updated on the scope directly and keeps our view in sync
            ngModelCtrl.$render = function() {
                $element.val($filter('postcode')(ngModelCtrl.$viewValue, false));
            };
            
            $element.bind('change', listener);
            // $element.bind('keydown', function(event) {
            //     var key = event.keyCode;
            //     // If the keys include the CTRL, SHIFT, ALT, or META keys, or the arrow keys, do nothing.
            //     // This lets us support copy and paste too
            //     if (key == 91 || (15 < key && key < 19) || (37 <= key && key <= 40)) return; 
            //     $browser.defer(listener); // Have to do this or changes don't get picked up properly
            // });
            
            $element.bind('paste cut', function() {
                $browser.defer(listener);
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