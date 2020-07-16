var https = require('https');

const AWS = require('aws-sdk');
const docClient = new AWS.DynamoDB.DocumentClient({ region: 'eu-west-3' });

exports.handler = async (event, callback) => {
   return new Promise((resolve, reject) => {
    var params = {
    TableName: 'WEDDING-CONFIGURATION',
    Key: {
      "key": "access_token"
    }
  };
  
  docClient.get(params, function (err, data) {
    if (err) {
      callback(Error(err), null);
    } else {
      const access_token = data.Item.value;

      const options = {
        host: 'graph.facebook.com',
        path: '/17841416201355353/media?access_token=' + access_token + '&fields=id,caption,like_count,media_type,media_url,permalink,comments_count&limit=10',
        method: 'GET'
      };
      
      var body='';
  
      const req = https.request(options, (res) => {
        console.log(res.statusCode);
        console.log(res.content);
        res.on('data', chunk => body += chunk);
        res.on('end', () => resolve(JSON.parse(body)));
      });
  
      req.on('error', (e) => {
        reject(e.message);
      });
  
      // send the request
      req.write('');
      req.end();
    }
  });
      
  });
};