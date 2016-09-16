require('isomorphic-fetch');
var AWS = require('aws-sdk');

module.exports = function(args){
  var { secret, required } = args;
  AWS.config.update(secret.awsConfig);
  var ec2 = new AWS.EC2();
  var info;
  fetch('http://169.254.169.254/latest/meta-data/instance-id')
  .then(function(response){
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
    var info = {};
    tagsObj.Tags.forEach(function(tag){
      if(required.indexOf(tag.Key) > -1){
        info[ tag.Key ] = tag.Value;
      }
    });
    return info;
  })
};

