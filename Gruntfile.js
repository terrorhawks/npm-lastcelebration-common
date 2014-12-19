module.exports = function(grunt) {

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
        }


    });

    grunt.loadNpmTasks('grunt-contrib-concat');

    //Default task
    grunt.registerTask('default', ['concat']);
};
