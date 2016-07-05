angular.module('common.resources')

.factory('Menu', ['$resource', 'domainName', 'Category', 'Product', 'ProductOptionGroup', function ($resource, domainName, Category, Product, ProductOptionGroup) {

    var transformer = function(data, header) {
      console.log("transformer for menu", data, header);
       //Getting string data in response
          var jsonData = angular.fromJson(data);
          var menus = [];
          var menu, category, product, optionGroup;

          angular.forEach(jsonData, function(menu) {
            // menu = new Menu(menu);
            if (menu.categories) {
              var categories = [];
              angular.forEach(menu.categories, function (category) {
                category = new Category(category);
                if (category.products) {
                  var products = [];
                  angular.forEach(category.products, function (product) {
                    product = new Product(product);
                    if (product.optionGroups) {
                      var optionGroups = [];
                      angular.forEach(product.optionGroups, function (optionGroup) {
                        optionGroup = new ProductOptionGroup(optionGroup);
                        optionGroups.push(optionGroup);
                      });
                      product.optionGroups = optionGroups;
                    }
                    products.push(product);
                  });
                  category.products = products;
                }
                categories.push(category);
              });
              menu.categories = categories;
            }
            menus.push(menu);
          });
          console.log("Menus Added", menus);
          return menus;
    };

    return $resource(domainName + '/api/dashboard/menus/:id', { id: '@id' }, {

    create: {
      method: 'POST',
      transformResponse: transformer
    },

    update: {
      method: 'PUT',
      transformResponse: transformer
    },
    
    query: {
      isArray: true,
      transformResponse: transformer
    },

    get: {
      transformResponse: transformer
    },

    delete: {
      transformResponse: transformer
    }

  });

}]);