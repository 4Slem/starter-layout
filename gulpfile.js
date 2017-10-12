var config = require('./sl.config');
var pkg = require('./package.json');
var gulp = require('gulp');
var $ = require('gulp-load-plugins')({
    pattern: ['*'],
    scope: ['devDependencies']
});
// Environments
var development = $.environments.development;
var production = $.environments.production;
// Notify errors
var onError = function (error) {
	$.notify({
		title: 'Gulp Task Error [' + error.plugin + ']',
        message: 'Check the console.'
	}).write(error);
	console.log(error.toString());
	this.emit('end');
};
// Banner on head file
var banner = [
    "/**",
    " * @project        <%= pkg.name %>",
    " * @author         <%= pkg.author %>",
    " * @build          " + $.moment().format("llll") + " ET",
    " * @release        " + $.gitRevSync.long() + " [" + $.gitRevSync.branch() + "]",
    " * @copyright      Copyright (c) " + $.moment().format("YYYY") + ", <%= pkg.copyright %>",
    " *",
    " */",
    ""
].join("\n");
// Nunjucks
gulp.task('nunjucks', function(){
	$.fancyLog('---> Compiling nunjucks ');
    return gulp.src(config.src.nunjucks + '*.njk')
        .pipe($.plumber({errorHandler: onError}))
        .pipe($.nunjucksRender({
            path: config.src.nunjucks,
            ext: '.html'
          }))
        .pipe(gulp.dest(config.build.base));
})
//Sass
gulp.task('sass', function() {
	$.fancyLog('---> Compiling sass ');
    return gulp.src(config.src.sass + '*.+(scss|sass)')
        .pipe($.sourcemaps.init())
        .pipe($.sass())
        .pipe($.autoprefixer({
            browsers: ['last 2 versions'],
            cascade: false
        }))
        .pipe($.size({gzip: true, showFiles: true}))
        .pipe($.sourcemaps.write())
        .pipe(gulp.dest(config.build.css))
        .pipe($.browserSync.stream({match: '**/*.css'}));
});
//JS
gulp.task('js', function(){
    $.fancyLog('---> Compiling js ');
    return gulp.src(config.src.js + '*.js')
        .pipe($.plumber({errorHandler: onError}))
        .pipe($.concat('app.front.js'))
        .pipe(gulp.dest(config.build.js));
})
gulp.task('js:watch', ['js'], function(done){
    $.browserSync.reload();
    done();
});
//Serve
gulp.task('serve', function(){
	$.browserSync.init({
            server: config.build.base,
            browser: 'chrome',
            notify: false
        });
});
//Watch
gulp.task('watch', function(){
	$.watch(config.src.nunjucks + '**/*.njk', function(){
        gulp.start('nunjucks');
    });
  	gulp.watch(config.build.base + '*.html').on('change', $.browserSync.reload);
    $.watch(config.src.sass + '**/*.+(scss|sass)', function(){
        gulp.start('sass');
    });
    $.watch(config.src.js + '*.js', function(){
        gulp.start('js:watch');
    });
});
//Default task
gulp.task('default', function() {
    $.runSequence(
        'nunjucks',
        'sass',
        'js',
        'serve',
        'watch'
    );
});