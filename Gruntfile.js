module.exports = function (grunt) {

    // Tasks
    grunt.initConfig({
        // Concatenates files
        concat: {
            services: {
                src: 'app/services/*.js',
                dest: 'build/services.js'
            },
            resources: {
                src: 'app/resources/*.js',
                dest: 'build/resources.js'
            },
           directives: {
                src:  'app/directives.js',
                dest: 'build/directives.js'
            },
            filters: {
                src:  'app/filters.js',
                dest: 'build/filters.js'
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
