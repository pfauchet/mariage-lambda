var https = require('https');

let credentials = require("./credentials.json");

const access_token = credentials.access_token;
const hashtag_node = credentials.hashtag_node;

exports.handler = async (event) => {

  return new Promise((resolve, reject) => {
    const options = {
      host: 'graph.facebook.com',
      path: '/' + hashtag_node + '/top_media?access_token=' + access_token + '&user_id=17841416201355353&fields=id,caption,like_count,media_type,media_url,permalink,comments_count&limit=12',
      method: 'GET'
    };

    var body = '';

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
  });
};