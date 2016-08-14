/*global module:false*/
module.exports = function (grunt) {

  var LIVERELOAD_PORT = 35731,
      HTTP_PORT = 9400,
      KARMA_PORT = 9877,
      WATCHED_FILES_SRC = [
        'src/**/*'
      ],
      WATCHED_FILES_SPEC = [
        'spec/**/*'
      ],
      WATCHED_FILES_DIST = [
        'dist/**/*'
      ],
      WATCHED_FILES_DEMO = [
        'demo/**/*',
      ],

      SINON_SOURCE_DIR = 'node_modules/karma-chai-plugins/node_modules/sinon/lib/sinon/';

  // Project configuration.
  grunt.config.init({
    pkg: grunt.file.readJSON('package.json'),
    meta: {
      version: '<%= pkg.version %>',
      banner: '// Backbone.Inline.Template, v<%= meta.version %>\n' +
        '// Copyright (c) <%= grunt.template.today("yyyy") %> Michael Heim, Zeilenwechsel.de\n' +
        '// Distributed under MIT license\n' +
        '// http://github.com/hashchange/backbone.inline.template\n' +
        '\n'
    },

    preprocess: {
      build: {
        files: {
          'dist/backbone.inline.template.js': 'src/backbone.inline.template.js'
        }
      },
      interactive: {
        files: {
          'web-mocha/index.html': 'web-mocha/_index.html'
        }
      }
    },

    concat: {
      options: {
        banner: "<%= meta.banner %>",
        process: function( src, filepath ) {
          var bowerVersion = grunt.file.readJSON( "bower.json" ).version,
              npmVersion = grunt.file.readJSON( "package.json" ).version;

          if ( npmVersion === undefined || npmVersion === "" ) grunt.fail.fatal( "Version number not specified in package.json. Specify it in bower.json and package.json" );
          if ( npmVersion !== bowerVersion ) grunt.fail.fatal( "Version numbers in package.json and bower.json are not identical. Make them match." + " " + npmVersion );
          if ( ! /^\d+\.\d+.\d+$/.test( npmVersion ) ) grunt.fail.fatal( 'Version numbers in package.json and bower.json are not semantic. Provide a version number in the format n.n.n, e.g "1.2.3"' );
          return src.replace( "__COMPONENT_VERSION_PLACEHOLDER__", npmVersion );
        }
      },
      build: {
        src: 'dist/backbone.inline.template.js',
        dest: 'dist/backbone.inline.template.js'
      }
    },

    uglify: {
      options: {
        banner: "<%= meta.banner %>",
        mangle: {
          except: ['jQuery', 'Zepto', 'Backbone', '_']
        },
        sourceMap: true
      },
      core: {
        src: 'dist/backbone.inline.template.js',
        dest: 'dist/backbone.inline.template.min.js'
      }
    },

    karma: {
      options: {
        configFile: 'karma.conf.js',
        browsers: ['PhantomJS'],
        port: KARMA_PORT
      },
      test: {
        reporters: ['progress'],
        singleRun: true
      },
      build: {
        reporters: ['progress'],
        singleRun: true
      }
    },

    jshint: {
      components: {
        // Workaround for merging .jshintrc with Gruntfile options, see http://goo.gl/Of8QoR
        options: grunt.util._.merge({
          globals: {
            // Add vars which are shared between various sub-components
            // (before concatenation makes them local)
          }
        }, grunt.file.readJSON('.jshintrc')),
        files: {
          src: ['src/**/*.js']
        }
      },
      concatenated: {
        options: grunt.util._.merge({
          // Suppressing 'W034: Unnecessary directive "use strict"'.
          // Redundant nested "use strict" is ok in concatenated file,
          // no adverse effects.
          '-W034': true
        }, grunt.file.readJSON('.jshintrc')),
        files: {
          src: 'dist/**/backbone.inline.template.js'
        }
      }
    },

    'sails-linker': {
      options: {
        startTag: '<!--SCRIPTS-->',
        endTag: '<!--SCRIPTS END-->',
        fileTmpl: '<script src="../%s"></script>',
        // relative doesn't seem to have any effect, ever
        relative: true,
        // appRoot is a misnomer for "strip out this prefix from the file path before inserting",
        // should be stripPrefix
        appRoot: ''
      },
      interactive_spec: {
        options: {
          startTag: '<!--SPEC SCRIPTS-->',
          endTag: '<!--SPEC SCRIPTS END-->'
        },
        files: {
          // the target file is changed in place; for generating copies, run preprocess first
          'web-mocha/index.html': ['spec/**/*.+(spec|test|tests).js']
        }
      },
      interactive_sinon: {
        options: {
          startTag: '<!--SINON COMPONENT SCRIPTS-->',
          endTag: '<!--SINON COMPONENT SCRIPTS END-->'
        },
        files: {
          // the target file is changed in place; for generating copies, run preprocess first
          //
          // The util/core.js file must be loaded first, and typeof.js must be loaded before match.js.
          //
          // mock.js must be loaded last (specifically, after spy.js). For the pattern achieving it, see
          // http://gruntjs.com/configuring-tasks#globbing-patterns
          'web-mocha/index.html': [
            SINON_SOURCE_DIR + 'util/core.js',
            SINON_SOURCE_DIR + 'typeof.js',
            SINON_SOURCE_DIR + '**/*.js',
            '!' + SINON_SOURCE_DIR + 'mock.js',
            SINON_SOURCE_DIR + 'mock.js'
          ]
        }
      }
    },

    // Use focus to run Grunt watch with a hand-picked set of simultaneous watch targets.
    focus: {
      demo: {
        include: ['livereloadDemo']
      },
      demoCi: {
        include: ['build', 'livereloadDemo']
      },
      demoCiDirty: {
        include: ['buildDirty', 'livereloadDemo']
      }
    },

    // Use watch to monitor files for changes, and to kick off a task then.
    watch: {
      options: {
        nospawn: false
      },
      // Live-reloads the web page when the source files or the spec files change. Meant for test pages.
      livereloadTest: {
        options: {
          livereload: LIVERELOAD_PORT
        },
        files: WATCHED_FILES_SRC.concat( WATCHED_FILES_SPEC )
      },
      // Live-reloads the web page when the dist files or the demo files change. Meant for demo pages.
      livereloadDemo: {
        options: {
          livereload: LIVERELOAD_PORT
        },
        files: WATCHED_FILES_DEMO.concat( WATCHED_FILES_DIST )
      },
      // Runs the "build" task (ie, runs linter and tests, then compiles the dist files) when the source files or the
      // spec files change. Meant for continuous integration tasks ("ci", "demo-ci").
      build: {
        tasks: ['build'],
        files: WATCHED_FILES_SRC.concat( WATCHED_FILES_SPEC )
      },
      // Runs the "build-dirty" task (ie, compiles the dist files without running linter and tests) when the source
      // files change. Meant for "dirty" continuous integration tasks ("ci-dirty", "demo-ci-dirty").
      buildDirty: {
        tasks: ['build-dirty'],
        files: WATCHED_FILES_SRC
      }
    },

    // Spins up a web server.
    connect: {
      options: {
        port: HTTP_PORT,
        // For restricting access to localhost only, change the hostname from '*' to 'localhost'
        hostname: '*',
        open: true,
        base: '.'
      },
      livereload: {
        livereload: LIVERELOAD_PORT
      },
      test: {
        options: {
          open: 'http://localhost:<%= connect.options.port %>/web-mocha/',
          livereload: LIVERELOAD_PORT
        }
      },
      testNoReload: {
        options: {
          open: 'http://localhost:<%= connect.options.port %>/web-mocha/',
          keepalive: true
        }
      },
      demo: {
        options: {
          open: 'http://localhost:<%= connect.options.port %>/demo/',
          livereload: LIVERELOAD_PORT
        }
      }
    },

    replace: {
      version: {
        src: ['bower.json', 'package.json'],
        overwrite: true,
        replacements: [{
          from: /"version"\s*:\s*"((\d+\.\d+\.)(\d+))"\s*,/,
          to: function (matchedWord, index, fullText, regexMatches) {
            var version = grunt.option('inc') ? regexMatches[1] + (parseInt(regexMatches[2], 10) + 1) : grunt.option('to');

            if (version === undefined) grunt.fail.fatal('Version number not specified. Use the --to option, e.g. --to=1.2.3, or the --inc option to increment the revision');
            if (typeof version !== "string") grunt.fail.fatal('Version number is not a string. Provide a semantic version number, e.g. --to=1.2.3');
            if (!/^\d+\.\d+.\d+$/.test(version)) grunt.fail.fatal('Version number is not semantic. Provide a version number in the format n.n.n, e.g. --to=1.2.3');

            grunt.log.writeln('Modifying file: Changing the version number from ' + regexMatches[0] + ' to ' + version);
            return '"version": "' + version + '",';
          }
        }]
      }
    },
    getver: {
      files: ['bower.json', 'package.json']
    }
  });

  grunt.loadNpmTasks('grunt-preprocess');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-karma');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-sails-linker');
  grunt.loadNpmTasks('grunt-text-replace');
  grunt.loadNpmTasks('grunt-focus');

  grunt.registerTask('lint', ['jshint:components']);
  grunt.registerTask('hint', ['jshint:components']);        // alias
  grunt.registerTask('test', ['jshint:components', 'karma:test']);
  grunt.registerTask('webtest', ['preprocess:interactive', 'sails-linker:interactive_sinon', 'sails-linker:interactive_spec', 'connect:testNoReload']);
  grunt.registerTask('interactive', ['preprocess:interactive', 'sails-linker:interactive_sinon', 'sails-linker:interactive_spec', 'connect:test', 'watch:livereloadTest']);
  grunt.registerTask('demo', ['connect:demo', 'focus:demo']);
  grunt.registerTask('build', ['jshint:components', 'karma:build', 'preprocess:build', 'concat', 'uglify', 'jshint:concatenated']);
  grunt.registerTask('ci', ['build', 'watch:build']);
  grunt.registerTask('setver', ['replace:version']);
  grunt.registerTask('getver', function () {
    grunt.config.get('getver.files').forEach(function (file) {
      var config = grunt.file.readJSON(file);
      grunt.log.writeln('Version number in ' + file + ': ' + config.version);
    });
  });

  // Special tasks, not mentioned in Readme documentation:
  //
  // - build-dirty:
  //   builds the project without running checks (no linter, no tests)
  // - ci-dirty:
  //   builds the project without running checks (no linter, no tests) on every source change
  // - demo-ci:
  //   Runs the demo (= "demo" task), and also rebuilds the project on every source change (= "ci" task)
  // - demo-ci-dirty:
  //   Runs the demo (= "demo" task), and also rebuilds the project "dirty", without tests or linter, on every source
  //   change (= "ci-dirty" task)
  grunt.registerTask('build-dirty', ['preprocess:build', 'concat', 'uglify']);
  grunt.registerTask('ci-dirty', ['build-dirty', 'watch:buildDirty']);
  grunt.registerTask('demo-ci', ['build', 'connect:demo', 'focus:demoCi']);
  grunt.registerTask('demo-ci-dirty', ['build-dirty', 'connect:demo', 'focus:demoCiDirty']);

  // Make 'build' the default task.
  grunt.registerTask('default', ['build']);


};
