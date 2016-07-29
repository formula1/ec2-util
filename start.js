require('isomorphic-fetch');
var child_process = require('child_process');
var shellescape = require('shell-escape');
var fs = require('fs');

var execPromise, removeIfExists;

var info;
fetch('http://169.254.169.254/latest/meta-data/instance-id').then(function(response){
  return response.text();
}).then(function(instanceName){
  return execPromise(
    'aws ec2 describe-tags ' +
    '--filters "Name=resource-type,Values=instance" ' +
    `"Name=resource-id,Values=${instanceName}"`
  );
}).then(function(tagsObj){
  info = {
    GitRepo : void 0,
    NODE_ENV : void 0,
    EnvVars : void 0,
    MasterURL : void 0
  };
  var keys = Object.keys(info);
  JSON.parse(tagsObj).Tags.forEach(function(tag){
    if(keys.indexOf(tag.Key) > -1){
      info[ tag.Key ] = tag.Value;
    }
  });
  if(!info.GitRepo) throw new Error('No git repo to clone from');
  return info.GitRepo;
}).then(function(repo){
  return removeIfExists(__dirname + '/application').then(function(){
    return child_process.execSync(
      'git ' + shellescape(['clone', repo, './application'])
    );
  });
}).then(function(stdout){
  console.log('cloned : ', stdout);
  return execPromise(
    'npm install',
    { 
      cwd : __dirname + '/application',
      uid : process.uid,
    }
  );
}).then(function(stdout){
  console.log('install : ', stdout);
  child_process.spawn('sudo', [ '-s', '--', '\'npm start\'' ], {
    detached : true,
    cwd : __dirname + '/application',
    stdio : [
      fs.createReadStream(__dirname + '/stdio'),
      fs.createWriteStream(__dirname + '/stdout.log'),
      fs.createWriteStream(__dirname + '/stderr.log')
    ],
    uid : process.uid,
    env : Object.assign(
      {},
      process.env,
      info.EnvVars || {},
      { NODE_ENV : info.NODE_ENV || 'development' }
    )
  });
}).catch(function(err){
  console.error(err);
});

var fs = require('fs');
var rimraf = require('rimraf');
removeIfExists = function(pathname){
  return new Promise(function(res, rej){
    fs.exists(pathname, function(boo){
      if(!boo) return res();
      rimraf(pathname, function(err){
        if(err) return rej(err)
        res();
      })
    });
  });
};

execPromise = function(string, options){
  return new Promise(function(res, rej){
    child_process.exec(
      string, options || {},
      function(err, stdout, stderr){
        if(err) return rej(err);
        if(stderr !== '' && stdout === '') return rej(stderr);
        return res(stdout);
      }
    );
  });
};
