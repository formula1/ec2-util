var child_process = require('child_process');
var shellescape = require('shell-escape');
var path = require('path');

var requiredKeys = ['home_directory', 'username', 'git_url', 'application_directory', 'NODE_ENV', 'env_vars'];
var info;

if(!module.parent){
  setImmediate(function(){
    module.exports(process.argv.splice(2));
  });
};

module.exports = function(args){
  var [ stackType, __secret ] = args;
  var secretInfo = require(__secret);
  Promise.resolve().then(function(){
    return require(`./environments/${stackType}`)({ secret : secretInfo, required : requiredKeys});
  }).then(function(retInfo){
    var defaultInfo = {};
    defaultInfo.username = process.env.LOGNAME;
    defaultInfo.home_directory = process.env.HOME;
    defaultInfo.ssh_file = './.ssh/id_rsa';
    defaultInfo.application_directory = process.env.APP_PATH || './application';
    defaultInfo.NODE_ENV = 'development';
    defaultInfo.env_vars = {};
    info = Object.assign({}, defaultInfo, secretInfo, retInfo);
    if(!info.home_directory) info.home_directory = path.join('/home/', info.username);
    info.ssh_file = path.resolve(info.home_directory, info.ssh_file);
    info.application_directory = path.resolve(info.home_directory, info.application_directory);
    console.log(info);
  }).then(function(){
    return require('./ssh-update')(info)
  }).then(function(){
    return require('./git-update')(info);
  }).then(function(stdout){
    console.log('repo : ', stdout.toString());
    return child_process.execSync(
      'npm install',
      { 
        cwd : info.application_directory
      }
    );
  }).then(function(stdout){
    console.log('install : ', stdout.toString());
    var child = child_process.spawn('npm', [ 'start' ], {
      cwd : info.application_directory,
      stdio : [ 'ignore', 'pipe', 'pipe' ],
      gid : process.gid,
      uid : process.uid,
      env : Object.assign(
        {},
        process.env,
        info.env_vars,
        { NODE_ENV : info.NODE_ENV }
      )
    });
    child.stdout.pipe(process.stdout);
    child.stderr.pipe(process.stderr);
  }).catch(function(err){
    console.error(err.stack);
  });
};

