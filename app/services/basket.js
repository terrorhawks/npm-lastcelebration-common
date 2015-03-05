angular.module('common.services')

    .factory('Basket', function ($rootScope, $localstorage, $filter) {
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
            newItem.totalPrice = newItem.price;
            if (optionsGroup && optionsGroup.length > 0) {
                newItem.selectedOptions = optionsGroup;

                angular.forEach(optionsGroup, function (optionGroup) {
                    angular.forEach(optionGroup.options, function(option){
                        newItem.totalPrice += option.price * option.quantity;
                    });
                });
            }
            return newItem;
        };

        var updateTotalPrice = function () {
            $rootScope.totalPrice = 0;
            var total = 0;
            angular.forEach(basket, function (item) {
                total += (item.totalPrice * item.quantity);
            });
            $rootScope.totalPrice = total;
        };

        var createItemId = function (item) {

            var encodeAsSlug = function (string){
                return string.split(" ").join("").toLowerCase();
            };

            var sortByName = function(array) {
                return $filter("orderBy")(array, "name", false);

            };

            var id = encodeAsSlug(item.name);
            var orderedOptions = sortByName(item.selectedOptions);

            angular.forEach(orderedOptions, function (optionGroup) {
                id += encodeAsSlug(optionGroup.name);
                angular.forEach(sortByName(optionGroup.options), function (option) {
                    if (option) {
                        id += encodeAsSlug(option.name);
                        id += option.quantity;
                    }
                });
            });
            return id;
        };

        var isSameItem = function (first, second) {

            return first.id == second.id;
        };

        updateTotalPrice();

        return {
            getBasket: function () {
                return basket;
            },

            getItemIndex: function (item) {
                var found;
                var itemWithId = item;
                if (!item.id){
                    itemWithId.id = createItemId(item);
                }
                basket.some(function (element) {
                    if (isSameItem(itemWithId, element.item)) {
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
                optionedItem.id = createItemId(optionedItem);
                var itemIndex = this.getItemIndex(optionedItem);
                if (itemIndex < 0) {
                    basket.push({item: optionedItem, quantity: amount, totalPrice: optionedItem.totalPrice});
                } else {
                    basket[itemIndex].quantity += amount;
                    basket[itemIndex].totalPrice = basket[itemIndex].item.totalPrice;
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
                }
                this.updateTotalPrice();
                $localstorage.setObject(createBasket(), basket);
            },

            getItemOptionsList: function (item){
                var options = [];
                if (item.item.selectedOptions){
                    angular.forEach(item.item.selectedOptions, function(groupOptions){
                        groupOptions.options.every(function (option) {
                            for (i=0; i < option.quantity; i++) {
                                options.push(option.name);
                            }
                            return true;
                        });
                    });
                }

                return options;
            },

            clear: function() {
                basket = undefined;
                $localstorage.setObject(baseBasketKey, undefined);
            },

            formOrder: function () {
                var order = {};
                var orderLineItems = [];

                angular.forEach(basket, function (element) {
                    for (var i = 0; i < element.quantity; i++) {
                        var orderLineItem = {};
                        orderLineItem.name = element.item.name;
                        orderLineItem.price = element.item.price;
                        orderLineItem.taxonomy = element.item.taxonomy;

                        orderLineItem.options = getOptions(element.item.selectedOptions);
                        orderLineItems.push(orderLineItem);
                    }
                });

                function getOptions(selectedOptions) {
                    var options = [];
                    angular.forEach(selectedOptions, function (selectedOption) {
                        angular.forEach(selectedOption.options, function (option) {
                            for (var j = 0; j < option.quantity; j++) {
                                var innerOption = {};
                                innerOption[option.name] = option.price;
                                options.push(innerOption);
                            }
                        });
                    });
                    return options;
                }

                order.order_line_items = orderLineItems;
                return order;
            }

        };

    });