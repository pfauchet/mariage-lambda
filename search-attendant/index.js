var { google } = require("googleapis");
let privatekey = require("./privatekey.json");
const dl = require("damerau-levenshtein-js");
const AWS = require('aws-sdk');
const docClient = new AWS.DynamoDB.DocumentClient({ region: 'eu-west-3' });
const uuidv4 = require('uuid/v4');
const sha256 = require('sha256')

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
  console.log(event)
  //Google Sheets API
  let spreadsheetId = '1T404n9zgF7lclrglI9JeGIjsglI2jdjwBQoi85F1ruQ';
  let sheetName = 'Invités!A2:E1000'
  let sheets = google.sheets('v4');

  sheets.spreadsheets.values.get({
    auth: jwtClient,
    spreadsheetId: spreadsheetId,
    range: sheetName
  }, function (err, response) {
    if (err) {
      console.log('The API returned an error: ' + err);
    } else {
      let found = false;
      
      for (let value of response.data.values) {
        let surname = value[1];
        let name = value[2];
        let plusOne = value[3];
        let children = value[4];

        let distance = dl.distance(surname.toLowerCase() + name.toLowerCase(), event.surname.toLowerCase().trim() + event.name.toLowerCase().trim());

        if (distance < 2) {
          console.log(distance);
          console.log(surname + name);
          found = true;
          let code = sha256(surname + name);
          let token = uuidv4();
          /*
          * Création de l'objet dans DynamoDB
          */
          if (!plusOne) {
            plusOne = null;
          }

          var milliseconds = Math.floor((new Date).getTime() / 1000);

          var insert_params = {
            Item: {
              code: code,
              surname: surname,
              name: name,
              plusOne: plusOne,
              children: children,
              token: token,
              ttl: milliseconds + 10 * 60
            },
            TableName: 'CONFIRMATION_TABLE'
          };
          console.log(insert_params);

          docClient.put(insert_params, function (err, data) {
            if (err) {
              console.log("Error happened with " + code + " : " + err)
              callback(err, null);
            } else {
              console.log("Success with : " + code)
              callback(null, {
                code: code,
                surname: surname,
                name: name,
                plusOne: plusOne,
                children: children,
                token: token
              })
            }
          });
        }
      }
      if (!found) {
        callback("NOT_FOUND", null)
      }
    }
  });
};

// this.handler({
//   name: "Faucher",
//   surname: "Paul"
// }, null, (err, data) => {
//   console.log(data);
// })