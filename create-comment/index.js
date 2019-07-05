var { google } = require("googleapis");
let privatekey = require("./privatekey.json");

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
  if (!event.name || !event.surname || !event.comment) {
    callback("Missing required values", null);
  } else {
    var values = [
      [
        event.name,
        event.surname,
        event.comment
      ]
    ];

    let resource = {
      values,
    };

    let spreadsheetId = '10mH2NOFFVV5nEUCUdCVWMki-XM4VbvmLEbBr-XY0GWQ';
    let sheetName = 'data!A2:Z1000';
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
        //console.log(result);
        callback(null, {
          status : "success"
        })
      }
    });
  }
};

// testEvent = {
//   name: "Paul",
//   surname: "Fauchet",
//   comment: "Coucou toi"
// }

// this.handler(testEvent, null, (err, res) => {
//   console.log(err)
//   console.log(res)
// })