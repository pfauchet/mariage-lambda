const AWS = require('aws-sdk');
const docClient = new AWS.DynamoDB.DocumentClient({ region: 'eu-west-3' });

exports.handler = async (event) => {
    var params = {
        TableName: 'ATTENDANTS_TABLE',
        Key: {
            "code": event.code
        }
    };

    docClient.get(params, function (err, data) {
        console.log(err)
        console.log(data)
        if (err) {
            const response = {
                statusCode: 400,
                body: err
            };
            return response;
        } else {
            const response = {
                statusCode: 200,
                body: data
            };
            return response;
        }
    });
};
