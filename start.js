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

  Promise.resolve().then(function(){
    return require(`./environments/${stackType}`)({ secret : require(__secret), required : requiredKeys});
  }).then(function(retInfo){
    info = retInfo;
    if(!info.home_directory) info.home_directory = process.env.HOME;
    if(!info.ssh_file) info.ssh_file = path.join(info.home_directory, './.ssh/id_rsa');
    else info.ssh_file = path.resolve(info.home_directory, info.ssh_file);
    if(!info.username) info.username = process.env.LOGNAME;
    if(!info.application_directory){
      info.application_directory = process.env.APP_PATH || path.resolve(info.home_directory, './application');
    }else{
      info.application_directory = path.resolve(info.home_directory, info.application_directory);
    }
    if(!info.NODE_ENV) info.NODE_ENV = 'development';
    if(!info.env_vars) info.env_vars = {};
  }).then(function(){
    return require('./ssh-update')(info)
  }).then(function(){
    return require('./git-update')(info);
  }).then(function(stdout){
    console.log('repo : ', stdout.toString());
    return child_process.execSync(
      'npm install',
      { 
        cwd : __application
      }
    );
  }).then(function(stdout){
    console.log('install : ', stdout.toString());
    var child = child_process.spawn('npm', [ 'start' ], {
      cwd : __application,
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
    console.error(err);
  });
};

