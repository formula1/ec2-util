require('isomorphic-fetch');
var child_process = require('child_process');
var shellescape = require('shell-escape');
var fs = require('fs');
var path = require('path');
var AWS = require('aws-sdk');

var secret = require('./secret.json');
AWS.config.update(secret);
var ec2 = new AWS.EC2();

var __application = process.env.APP_PATH ||
  path.resolve(__dirname, '../application');

var execPromise, fileExists, removeIfExists;

var info;
fetch('http://169.254.169.254/latest/meta-data/instance-id').then(function(response){
  return response.text();
}).then(function(instanceName){
  return new Promise(function(res, rej){
    ec2.describeTags({
      Filters : [
        { Name : 'resource-type', Values : [ 'instance' ] },
        { Name : 'resource-id', Values : [ instanceName ] }
      ]

    }, function(err, data){
      if(err) return rej(err);
      res(data);
    })
  });
}).then(function(tagsObj){
  info = {
    GitRepo : void 0,
    NODE_ENV : void 0,
    EnvVars : void 0,
    MasterURL : void 0
  };
  var keys = Object.keys(info);
  tagsObj.Tags.forEach(function(tag){
    if(keys.indexOf(tag.Key) > -1){
      info[ tag.Key ] = tag.Value;
    }
  });
  if(!info.GitRepo) throw new Error('No git repo to clone from');
  return info.GitRepo;
}).then(function(repo){
  return fileExists(__application + '/package.json').then(function(boo){
    if(!boo){
      return child_process.execSync(
        'sudo -u ubuntu  git ' + shellescape(['clone', repo, __application])
      );
    }
    return child_process.execSync(
      'sudo -u ubuntu git pull', { cwd : __application }
    )
  });
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
      info.EnvVars || {},
      { NODE_ENV : info.NODE_ENV || 'development' }
    )
  });

  child.stdout.pipe(process.stdout);
  child.stderr.pipe(process.stderr);

}).catch(function(err){
  console.error(err);
});

var fs = require('fs');
var rimraf = require('rimraf');

fileExists = function(pathname){
  return new Promise(function(res){
    fs.exists(pathname, res);
  });
};

removeIfExists = function(pathname){
  return fileExists(pathname).then(function(boo){
    if(!boo) return;
    return new Promise(function(res, rej){
      rimraf(pathname, function(err){
        if(err) return rej(err)
        res();
      });
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
