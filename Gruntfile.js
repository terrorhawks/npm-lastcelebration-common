module.exports = function (grunt) {

    // Tasks
    grunt.initConfig({
        // Concatenates files
        concat: {
            options: {
                // the banner is inserted at the top of the output
                banner: "angular.module('common.directives', []); \nangular.module('common.filters', []); \nangular.module('common.resources', []); \nangular.module('common.services', []); \n\n"
            },
            services: {
                src: ['app/services/*.js', 'app/resources/*.js', 'app/directives.js', 'app/filters.js'],
                dest: 'build/lc-common.js'
            }
        },
        jshint: {
            all: ['Gruntfile.js', 'app/**/*.js', 'app/*.js']
        }


    });

    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    //Default task
    grunt.registerTask('default', ['jshint', 'concat']);
};
