angular.module('common.services')

    .factory('Basket', function ($rootScope, $localstorage) {
        var baseBasketKey = "basket";

        var createBasket = function () {
            return baseBasketKey;
        };

        var basket = $localstorage.getObject(createBasket());

        if (!basket) {
            basket = [];
            $localstorage.setObject(createBasket(), basket);
        }

        var addOptionsToItem = function (item, options) {
            if (options && options.length > 0) {
                item.selectedOptions = options;
                angular.forEach(options, function (option) {
                    item.price += option.price * option.quantity;
                });
            }

            return item;
        };

        var updateTotalPrice = function () {
            $rootScope.totalPrice = 0;
            var total = 0;
            angular.forEach(basket, function (item) {
                total += item.totalPrice;
            });
            $rootScope.totalPrice = total;
        };

        var isSameItem = function (first, second) {
            var isSameOptions = function () {


                return first.selectedOptions.every(function (option) {
                    return second.selectedOptions.some(function (element) {
                        return element.name == option.name && element.quantity == option.quantity;
                    });
                });
            };

            return (first.name === second.name) && ( first.selectedOptions == second.selectedOptions) &&
                (!!first.selectedOptions || isSameOptions());

        };

        updateTotalPrice();

        return {
            getBasket: function () {
                return basket;
            },

            getItemIndex: function (item) {
                var found;
                basket.some(function (element) {
                    if (isSameItem(item, element.item)) {
                        found = element;
                        return true;
                    }
                });

                return basket.indexOf(found);
            },

            addToBasket: function (item, quantity, selectedOptions) {
                // If quantity is specified(for example on menu options page) then use it, else 1
                var amount = quantity ? quantity : 1;
                item = addOptionsToItem(item, selectedOptions);
                var itemIndex = this.getItemIndex(item);
                if (itemIndex < 0) {
                    basket.push({item: item, quantity: amount, totalPrice: item.price * amount});
                } else {
                    basket[itemIndex].quantity += amount;
                    basket[itemIndex].totalPrice = basket[itemIndex].item.price * basket[itemIndex].quantity;
                }
                this.updateTotalPrice();
                $localstorage.setObject(createBasket(), basket);
            },

            updateTotalPrice: function () {
                updateTotalPrice();
            },

            removeFromBasket: function (item) {
                var index = this.getItemIndex(item);

                if (basket[index].quantity == 1) {
                    basket.splice(index, 1);
                } else {
                    basket[index].quantity--;
                    basket[index].totalPrice -= basket[index].item.price;
                }
                this.updateTotalPrice();
                $localstorage.setObject(createBasket(), basket);
            }

        };

    });
