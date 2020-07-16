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
      console.log(access_token);
      
      params = {
        TableName: 'WEDDING-CONFIGURATION',
        Key: {
          "key": "hashtag_node"
        }
      };
      
      docClient.get(params, function (err, data) {
        if (err) {
          callback(Error(err), null);
        } else {
          const hashtag_node = data.Item.value;
          console.log(hashtag_node);
          
          const options = {
              host: 'graph.facebook.com',
              path: '/'+ hashtag_node + '/recent_media?access_token=' + access_token + '&user_id=17841416201355353&fields=id,caption,like_count,media_type,media_url,permalink,comments_count&limit=12',
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
    }
  });
      
  });
};