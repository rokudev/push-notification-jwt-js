var readline = require('readline/promises');
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});
var webtoken = require('jsonwebtoken');
var jwksclient = require('jwks-rsa');
var prodKeyUrl = "https://assets.cs.roku.com/keys/partner-jwks.json";
var testKeyUrl = "https://assets.cs.roku.com/keys/partner-jwks-test.json"


async function start() {
    let action = await rl.question("Please choose environment. \n \
    1. Production \n \
    2. Test \n")

    let messageBody = await rl.question("Enter message body \n");

    switch (action) {
        case "1":
            await decodeAndVerifyMessage(messageBody, prodKeyUrl);
            break;
        case "2":
            await decodeAndVerifyMessage(messageBody, testKeyUrl);
            break;
        default:
            console.log("Not implimented.")
            break;
    }

    await start()
}


let decodeAndVerifyMessage = async (token, keyUrl) => {
    var decodedPayload = webtoken.decode(token, { complete: true });
    console.log("*************** Decoded token *******************");
    console.log(decodedPayload);
    if (decodedPayload && decodedPayload.header) {
        // Retrieve header
        let kid = decodedPayload.header.kid
        let jku = keyUrl
        let jkuClient = jwksclient({ jwksUri: jku });
        let key = await jkuClient.getSigningKey(kid)
        let signKey = key.getPublicKey();
        try {
            // Verify method will take care of the registred claims and signature validation.
            let verifiedToken = webtoken.verify(token, signKey);
            // Retrieve roku private claims.
            let messageType = verifiedToken["x-Roku-message-type"]
            let message = verifiedToken["x-Roku-message"]
            console.log("*************** Decoded message *******************");
            // Validate push notification is from roku production environment.
            if (messageType == "roku.rpay.push") {
                let buff = Buffer.from(message, "base64");
                console.log(JSON.parse(buff.toString('utf-8')));
            }
            // Any message body that is not from rpay production endpoint.
            else {
                console.log(verifiedToken);
            }
        } catch (err) {
            console.log(err.message);
        }
    }
}

start();


