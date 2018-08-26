/*
* Helpers for various tasks
*
*/

// Dependencies
var crypto = require('crypto');
var config = require('./config');
var https = require('https');
var querystring = require('querystring');


// Container for all the Helpers
var helpers = {};

// Create a SHA256 hash
helpers.hash = function (string) {
    if (typeof (string) == "string" && string.length > 0) {
        var hash = crypto.createHmac("sha256", config.hashingSecret).update(string).digest("hex");
        return hash;
    } else {
        return false;
    }
};

// Parse a JSON string to an object in all cases without throwing
helpers.parseJsonToObject = function (string) {
    try {
        var object = JSON.parse(string);
        return object;
    } catch (e) {
        return {};
    }
}

// Create a string of random alphanumeric characters, of a given length
helpers.createRandomString = function (strLength) {
    strLength = typeof (strLength) == "number" && strLength > 0 ? strLength : false;
    if (strLength) {
        // Define all the possible characters that could go into a string
        var possibleCharacters = "abcdefghijklmnopqrstuvwxyz0123456789";

        //Start the final string
        var str = "";
        for (i = 0; i < strLength; i++) {
            // Get a random character from the possibleCharacters string
            var randomCharacter = possibleCharacters.charAt(Math.floor(Math.random() * possibleCharacters.length));
            // Append this character to the final string
            str += randomCharacter;
        }
        // Return the final string
        return str;
    } else {
        return false;
    }
}
helpers.createPayment = function (email, amount, description, callback) {
    amount = typeof (amount) == "number" ? amount : false;
    email = typeof (email) == "string" && email.trim().length > 0 ? email.trim() : false;
    if (email && amount) {
        var charge = {
            amount: amount * 100,
            currency: 'nzd',
            description: description,
            source: "tok_visa"
        }

        var stringPayload = querystring.stringify(charge);
        var requestDetails = {
            hostname: 'api.stripe.com',
            method: 'POST',
            path: '/v1/charges',
            headers: {
                'Authorization': "Bearer " + config.stripe.secretKey,
                'Content-Length': Buffer.byteLength(stringPayload),
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        };

        // Instantiate the request object
        var req = https.request(requestDetails, function (res) {
            // Grab the status of the sent request
            var status = res.statusCode;
            // Callback successfully if the request went through
            if (status == 200 || status == 201) {
                callback(false);
            } else {
                callback("Status code returned was " + status);
            }
        });

        // Bind to the error event so it doesn't get thrown
        req.on("error", function (e) {
            callback(e);
        });

        // Add the payload
        req.write(stringPayload);

        // End the request
        req.end();
    } else {
        callback("Given parameters were missing or invalid");
    }
};


helpers.sendRecipt = function (email, subject, message, callback) {
    
    email = typeof (email) == "string" && email.trim().length > 0 ? email.trim() : false;
    subject = typeof (subject) == "string" && subject.trim().length > 0 ? subject.trim() : false;
    message = typeof (message) == "string" && message.trim().length > 0 ? message.trim() : false;

    if (email && subject && message) {
        var messageObject = {
            from: "me@samples.mailgun.org",
            to: email,
            subject: subject,
            text: message
        }

        var stringPayload = querystring.stringify(messageObject);
        console.log(stringPayload);
        
        var requestDetails = {
            hostname: 'api.mailgun.net',
            method: 'POST',
            path: '/v3/sandbox8510950ce32c4be9ba573a5d7df08c90.mailgun.org/messages',
            headers: {
                'Authorization': 'Basic ' + Buffer.from('api:' + config.mailgun.secretKey).toString('base64'),
                'Content-Length': Buffer.byteLength(stringPayload),
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        };

        // Instantiate the request object
        var req = https.request(requestDetails, function (res) {
            // Grab the status of the sent request
            var status = res.statusCode;
            // Callback successfully if the request went through
            if (status == 200 || status == 201) {
                callback(false);
            } else {
                callback("Status code returned was " + status);
            }
        });

        // Bind to the error event so it doesn't get thrown
        req.on("error", function (e) {
            callback(e);
        });

        // Add the payload
        req.write(stringPayload);

        // End the request
        req.end();
    } else {
        callback("Given parameters were missing or invalid");
    }
}
// Export the module
module.exports = helpers;