var https = require('https');

const AWS = require('aws-sdk');
const docClient = new AWS.DynamoDB.DocumentClient({ region: 'eu-west-3' });

exports.handler = async (event) => {
  return new Promise((resolve, reject) => {
    if (!event.authorization_code || !event.redirect_uri) {
      reject("Missing parameter");
    } else {
      
      const options = {
        host: 'graph.facebook.com',
        path: '/v3.3/oauth/access_token?client_id=478083806341667&redirect_uri=' + event.redirect_uri + '&client_secret=e7e16c27ddf8108a2c849436975bef85&code='+event.authorization_code,
        method: 'GET'
      };
  
      var body = '';
  
      const req = https.request(options, (res) => {
        console.log(res.statusCode);
        console.log(res.content);
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          if(res.statusCode != 200){
            reject("Problem during authorization_code exchange");
            console.log(body);
          }
          else{
             var insert_params = {
                Item: {
                  key: "access_token",
                  value: JSON.parse(body).access_token
                },
                TableName: 'WEDDING-CONFIGURATION'
              };
              docClient.put(insert_params, function (err, data) {
                if (err) {
                  console.log("Error happened " + err);
                  reject(err, null);
                } else {
                  console.log("Success updating access_token");
                  resolve("Success updating access_token");
                }
              });
          }
        }
        );
      });
  
      req.on('error', (e) => {
        reject(e.message);
      });
  
      // send the request
      req.write('');
      req.end();
      
      }
  });
};