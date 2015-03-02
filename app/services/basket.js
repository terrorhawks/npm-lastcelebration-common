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

        var addOptionsToItem = function (item, optionsGroup) {
            var newItem = JSON.parse(JSON.stringify(item));
            if (optionsGroup && Object.keys(optionsGroup).length > 0) {
                newItem.selectedOptions = optionsGroup;

                angular.forEach(optionsGroup, function (optionGroup, name) {
                    angular.forEach(optionGroup, function(option){
                        newItem.price += option.price * option.quantity;
                    });
                });
            }
            return newItem;
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
                var isSame = true;
                var isFirstOptioned = !first.selectedOptions;
                var isSecondOptioned = !second.selectedOptions;
                if (isFirstOptioned == isSecondOptioned) {
                    if (first.selectedOptions) {
                        if ((Object.keys(first.selectedOptions).length == Object.keys(second.selectedOptions).length)) {
                            angular.forEach(first.selectedOptions, function (elements, name) {
                                if (second.selectedOptions[name]) {
                                    first.selectedOptions[name].every(function (option) {
                                        return second.selectedOptions[name].some(function (element) {
                                            isSame = isSame && (element.name == option.name && element.quantity == option.quantity);
                                            return isSame;
                                        });
                                    });
                                } else {
                                    return false;
                                }
                            });

                        } else {
                            return false;
                        }
                    } else {
                        return true;
                    }
                } else {
                    return false;
                }

                return isSame;
            };
            return (first.name === second.name) && isSameOptions();

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

                var optionedItem = addOptionsToItem(item, selectedOptions);
                var itemIndex = this.getItemIndex(optionedItem);
                if (itemIndex < 0) {
                    basket.push({item: optionedItem, quantity: amount, totalPrice: optionedItem.price * amount});
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
            },

            getItemOptions: function (item){
                var options = [];
                console.log("item to get options");
                console.log(item);
                if (item.item.selectedOptions){
                    angular.forEach(item.item.selectedOptions, function(groupOptions, name){
                        console.log(groupOptions);
                        groupOptions.every(function(option){
                            options.push(option.name);
                            return true;
                        });
                    });
                }

                return options;
            }

        };

    });