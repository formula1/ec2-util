var fs = require('fs');
var path = require('path');

module.exports = function(config){
  return Promise.resolve().then(function(){
    if(!config.ssh_file) throw new Error('need an ssh file');

    var __home = config.home_directory
    if(!fs.existsSync(__home)){
      throw new Error('home directory doesn\'t exist');
    }

    var __ssh = path.join(__home, './.ssh');
    if(!fs.existsSync(__ssh)){
      throw new Error('ssh folder does not exist');
    }
    
    var configfile = path.join(__ssh, './.config');
    var contents = `IdentityFile ${config.ssh_file}`;
    if(fs.existsSync(configfile)){
      if(fs.readFileSync(configFile).toString() !== contents){
        throw new Error('config file already exists');
      }
    }else{
      fs.writeFileSync(configFile, contents);
    }
  });
};

