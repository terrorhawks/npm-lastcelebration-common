angular.module('common.resources')

.factory('Category', ['$resource', 'domainName','Product', 'ProductOptionGroup', function ($resource, domainName, Product, ProductOptionGroup) {

   var transformer = function(data, header) {
        var category, product, optionGroup;

        category = angular.fromJson(data);

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
        return category;
    };


  return  $resource(domainName + '/api/dashboard/categories/:id', { id: '@id' }, {

    create: {
      method: 'POST',
      transformResponse: transformer
    },

    update: {
      method: 'PUT',
      transformResponse: transformer
    },
    
    query: {
      isArray: true
    },

    get: {
      transformResponse: transformer
    },

    delete: {
      method: 'DELETE',
      transformResponse: transformer
    }

  });

}]);