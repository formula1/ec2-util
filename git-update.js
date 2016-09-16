var fs = require('fs');
var fp = require('child_process');
var rimraf = require('rimraf');

module.exports = function(info){
  if(!info.git_url) throw new Error('No git repo to clone from');
  var repo = info.git_url;
  var user = info.username;
  var __application = info.application_directory;
  return Promise.resolve().then(function(){
    if(!fs.existsSync(__application + '/package.json')) return false;
    return Promise.resolve(fp.execSync(
      'git config --get remote.origin.url', { cwd : __application }
    )).then(function(url){
      if(url.toString() === repo) return true;
      return new Promise(function(res, rej){
        rimraf(__application, function(err){
         if(err) return rej(err)
          res();
        });
      }).then(function(){
        return false;
      });
  }).then(boo);
    if(!boo){
      fp.execSync(
        shellescape(['ssh-keyscan' repo, '>>', path.join(__home, './.ssh/known_hosts') ])
      );
      return fp.execSync(
        shellescape(['sudo', '-u', user, 'git', 'clone', repo, __application])
      );
    }else{
      return fp.execSync(
        shellescape(['sudo', '-u', user, 'git', 'pull']),
        { cwd : __application }
      );
    }
  });
};

