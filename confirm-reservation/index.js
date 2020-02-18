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
  if (!event.email || (event.isWithChildren && !event.nbChildren)) {
    callback(Error("MISSING_PARAMETER"), null);
  }
  else if (!validateEmail(event.email)) {
    callback(Error("INVALID_EMAIL"), null);
  }
  else {
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
            callback(Error("INVALID_TOKEN"), null);
          }
          else {
            var values = [
              [
                results.name,
                results.surname,
                results.surname + ' ' + results.name,
                results.children,
                results.plusOne,
                event.isAttending,
                event.isWithPlusOne,
                event.isWithChildren,
                event.nbChildren,
                event.needsBabySitter,
                event.needsDriver,
                event.email.toLowerCase(),
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
                /*
                * Envoi de l'email au compte
                */
                var eParams = {
                  Destination: {
                    ToAddresses: ["contact@lydiaetpaul2020.fr"]
                  },
                  Message: {
                    Body: {
                      Html: {
                        Charset: "UTF-8", 
                        Data: results.surname + " " + results.name + " vient de répondre sur le site internet"
                      }
                    },
                    Subject: {
                      Data: "[Organisation Mariage] Nouvelle confirmation de présence !"
                    }
                  },
                  Source: "contact@lydiaetpaul2020.fr"
                };

                ses.sendEmail(eParams, function (err, data) {
                  if (err)
                    console.log(err);
                  else
                    console.log("email sent to : " + event.email);
                });

                callback(null, {
                  status: "success"
                })
              }
            });
          }
        }
        else {
          callback(Error("INVALID_CODE"), null);
        }
      }
    });
  }
};

function validateEmail(email) {
  var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(email).toLowerCase());
}
