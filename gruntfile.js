import grunt from 'grunt';

const APP_FOLDER = 'app';
const DIST_FOLDER = 'dist';

grunt.initConfig({
    babel: {
        options: {
            sourceMap: true
        },
        dist: {
            files: [{
               expand: true,
               cwd: 'src',
               src: [ '**/*.js'
                    , '!**/*.babel.js'
                    , `!${APP_FOLDER}/**/*.js`],
               dest: DIST_FOLDER,
               ext: '.js'
            }]
        }
    }
    
   , clean: [DIST_FOLDER]

   , eslint: {
        target: {
            expand: true
          , cwd   : 'src'
          , src   : [ '**/*.js'
                    , '!app/**/*.js']
          , dest  : DIST_FOLDER
          , ext   : '.js'}
     }

   , watch: {
      scripts: {
         files: [ 'src/**/*.js'
                , 'gruntfile.js'
                , 'package.json'
                , '.eslintrc.js']
        , tasks: ['build']
        , options: {
            spawn: false
         }
      }
}

});

// Load the plugin that provides the "uglify" task.
grunt.loadNpmTasks('grunt-babel');
grunt.loadNpmTasks('grunt-contrib-clean');
grunt.loadNpmTasks('grunt-contrib-watch');
grunt.loadNpmTasks('grunt-eslint');

// Registring all tasks
grunt.registerTask('build', ['clean', 'eslint', 'babel']);
grunt.registerTask('default', ['build']); 
