var { google } = require("googleapis");
let privatekey = require("./privatekey.json");
const AWS = require('aws-sdk');
const docClient = new AWS.DynamoDB.DocumentClient({ region: 'eu-west-3' });

//process.env.HTTPS_PROXY = "http://127.0.0.1:9000/"

// configure a JWT auth client
let jwtClient = new google.auth.JWT(
  privatekey.client_email,
  null,
  privatekey.private_key,
  [
    'https://www.googleapis.com/auth/spreadsheets'
  ]
);

//authenticate request
jwtClient.authorize(function (err, tokens) {
  if (err) {
    console.log(err);
    return;
  } else {
    console.log("Successfully connected!");
  }
});

exports.handler = (event, context, callback) => {
  //Google Sheets API
  let spreadsheetId = '1r3uN2UUx1E4k0QZqETvBXfeFEGqMkOrFtDab9PFToGc';
  let sheetName = 'data!A2:Z1000'
  let sheets = google.sheets('v4');

  sheets.spreadsheets.values.get({
    auth: jwtClient,
    spreadsheetId: spreadsheetId,
    range: sheetName
  }, function (err, response) {
    if (err) {
      console.log('The API returned an error: ' + err);
    } else {
      console.log('Results : ' + JSON.stringify(response.data));
      for (let value of response.data.values) {
        let code = value[0];
        let surname = value[1];
        let name = value[2];
        console.log("code = " + code);

        /*
        * Création de l'objet dans DynamoDB
        */
        var insert_params = {
          Item: {
            code: code,
            surname: surname,
            name: name
          },
          TableName: 'CONFIRMATION_TABLE'
        };

        docClient.put(insert_params, function (err, data) {
          if (err) {
            console.log("Error happened with " + code + " : " + err)
          } else {
            console.log("Success with : " + code)
          }
        });
      }
      callback(null, {
        status: "success"
      })
    }
  });
};

// this.handler(null, null, () => {
//   console.log("done")
// })