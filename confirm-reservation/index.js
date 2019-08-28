const AWS = require('aws-sdk');
const docClient = new AWS.DynamoDB.DocumentClient({ region: 'eu-west-3' });
const ses = new AWS.SES({
  region: 'eu-west-1'
});
var { google } = require("googleapis");
let privatekey = require("./privatekey.json");

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

exports.handler = function (event, context, callback) {

  var params = {
    TableName: 'CONFIRMATION_TABLE',
    Key: {
      "code": event.code
    }
  };

  docClient.get(params, function (err, data) {
    if (err) {
      callback(Error(err), null);
    } else {
      let results = data.Item
      if (results) {
        if (results.token != event.token) {
          callback(Error("Token invalide."), null);
        }
        else {
          var values = [
            [
              results.name,
              results.surname,
              results.children,
              results.plusOne,
              event.isAttending,
              event.isWithPlusOne,
              event.isWithChildren,
              event.email,
              new Date()
            ]
          ];

          let resource = {
            values,
          };

          let spreadsheetId = '1T404n9zgF7lclrglI9JeGIjsglI2jdjwBQoi85F1ruQ';
          let sheetName = 'Réponses!A2:Z1000';
          let sheets = google.sheets('v4');
          let valueInputOption = "RAW";

          sheets.spreadsheets.values.append({
            auth: jwtClient,
            spreadsheetId: spreadsheetId,
            range: sheetName,
            valueInputOption: valueInputOption,
            resource,
          }, (err, result) => {
            if (err) {
              callback(err, null)
            } else {
              //event.email = "fauchet.paul@gmail.com"
              if (event.email) {
                /*
                * Envoi de l'email au compte
                */
                var eParams = {
                  Destination: {
                    ToAddresses: [event.email]
                  },
                  Message: {
                    Body: {
                      Text: {
                        Data: "Au top, merci d'avoir répondu :)"
                      }
                    },
                    Subject: {
                      Data: "[Lydia & Paul 2020] Confirmation de votre venue"
                    }
                  },
                  Source: "fauchet.paul@gmail.com"
                };

                ses.sendEmail(eParams, function (err, data) {
                  if (err)
                    console.log(err);
                  else
                    console.log("email sent to : " + event.email);
                });
              }
              callback(null, {
                status: "success"
              })
            }
          });
        }
      }
      else {
        callback(Error("Code invalide."), null);
      }
    }
  });
};
