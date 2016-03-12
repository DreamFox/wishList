module.exports = function(grunt) {

    var path = {
        src : '',
        dest : 'dist',
        tmp : '.tmp'
    };
    // Project configuration.
    grunt.initConfig({
        path: path,
        clean : {
            beforebuild : {
                files : [{
                        src : ['<%= path.dest %>/', '<%= path.tmp %>/']
                    }
                ]
            }
        },
        copy : {
            build : {
                files : [{
                        expand : true,
                        cwd : '',
                        src : ['index.html', '*.png'],
                        dest : '<%= path.dest %>/'
                    }
                ]
            }
        },
        useminPrepare : {
            build : {
                files : [{
                        src : 'index.html'
                    }
                ]
            }
        },
        usemin:{
            html : {
                files : [{
                        src : '<%= path.dest %>/index.html'
                    }
                ]
            },
            css : {
                files : [{
                        src : '<%= path.dest %>/*.css'
                    }
                ]
            }
        }
    });

    // 加载插件
    require('load-grunt-tasks')(grunt);

    // 默认被执行的任务列表。
    grunt.registerTask('default', ['clean:beforebuild', 'copy', 'useminPrepare',
        'concat', 'cssmin', 'uglify', 'usemin']);

};