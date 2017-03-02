var request = require('request-promise');

function getCloudantCredential(param) {
    var cloudantUrl;

    if (param.cloudant_url) {
        // use bluemix binding
        cloudantUrl = param.cloudant_url;
    } else {
        if (!param.host) {
            whisk.error('cloudant account host is required.');
            return;
        }
        if (!param.username) {
            whisk.error('cloudant account username is required.');
            return;
        }
        if (!param.password) {
            whisk.error('cloudant account password is required.');
            return;
        }

        cloudantUrl = "https://" + param.username + ":" + param.password + "@" + param.host;
    }

    if (!param.cloudant_reviews_db) {
        whisk.error('cloudant db is required.');
        return;
    }

    var cloudant = require('cloudant')({
        url: cloudantUrl,
        plugin:'default'
    });

    return cloudant;
}

function getCloudantChange(params) {
    var dbName = params.dbname;
    var cloudant = params.cloudant;
    var id = params.id;

    return new Promise(function(resolve, reject) {
        var cloudantdb = cloudant.db.use(dbName);
        cloudantdb.get(id, function(error, response) {
            console.log(response);

            if (!error) {
                console.log('success', response);
                if (response.analysis === null) {
                    params.review = response;
                }
                resolve(params);
            } else {
                console.error('error', error);
                reject(error);
            }
        });
    });
}

function analyzeText(params) {
    if (params.review === null) {
        return Promise.resolve(params);
    }

    var watsonURL = params.watson_url + "/v3/tone?version=2016-05-19";
    var watsonAuth = new Buffer(params.watson_username + ":" + params.watson_password).toString('base64');
    console.log('text to analyze: ', params.review.comment);

    var requestOptions = {
        method: 'POST',
        uri: watsonURL,
        headers: {
            'Authorization': 'Basic ' + watsonAuth,
            'Content-Type': 'text/plain'
        },
        body: params.review.comment,
        json: false
    };

    return request(requestOptions).
        then(function(parsedBody) {
            console.log("watson analysis:", parsedBody);
            var doc_analysis = JSON.parse(parsedBody);

            // parse the watson response. 

            var max_doc_tone = 0.0;
            var max_emotion = "";
            for (i = 0; i < doc_analysis.document_tone.tone_categories[0].tones.length; i++) {
                var emotion_tone = doc_analysis.document_tone.tone_categories[0].tones[i];

                console.log("emotion: ", emotion_tone.tone_id, ", score: ", emotion_tone.score);
                if (max_doc_tone < emotion_tone.score) {
                    max_doc_tone = emotion_tone.score;
                    max_emotion = emotion_tone.tone_id.trim();
                }
            }

            console.log("The max emotion was: ", max_emotion, ", score: ", max_doc_tone);

            if (max_emotion != "joy") {
                console.log("Flagging comment!");
            }  else {
                params.review.flagged = false;
            }

            params.review.analysis = doc_analysis;

            return Promise.resolve(params);

        }).
        catch(function(err) {
            console.log("error! ", err);

            return err;
        });
}

function insertRecord(params) {
    if (params.review === null) {
        return Promise.resolve(params);
    }

    var cloudant = params.cloudant;
    var dbName = params.cloudant_reviews_db;
    var review = params.review;

    // remove the _rev property since it's being inserted into a new database
    delete review._rev;

    return new Promise(function(resolve, reject) {
        console.log("inserting review: ", review);
        var cloudantdb = cloudant.db.use(dbName);
        cloudantdb.insert(review, function(err, body) {
            if (!err) {
                //console.log("updated message, response: ", body);
                resolve(body);
            } else {
                console.error("error: ", err);
                reject(err);
            }
        });
    });
}

function main(params) {

    var cloudantOrError = getCloudantCredential(params);
    if (typeof cloudantOrError !== 'object') {
        return whisk.error('getCloudantAccount returned an unexpected object type.');
    }

    console.log(params);
    var cloudant = cloudantOrError;
    params.cloudant = cloudant;

    return Promise.resolve(params)
        .then(getCloudantChange)
        .then(analyzeText)
        .then(insertRecord);
}

/*
var fs = require('fs');
var paramFile = fs.readFileSync('socialReviewParams.json');
var watsonParam = JSON.parse(paramFile);
watsonParam['changes'] = [ { rev: '1-b7730f9b3622b7281209192db8af50b1' } ];
watsonParam['seq'] = '4-g1AAAAXpeJy11MFNwzAUBmBDkRAnugEc4Nji58RxfaIbwAbgZ8cqVZoi1J5hA9gANoANYAPYADYoGxQHIxpXok2JekmkKPp-6_16zgghzV7DkEODeniVdg0Ca-OgpXXLqKxFoa2z4diofNTO01Hmft9UBHen02m_11Bk4D5ss9iwDjWG7Ixzk9qLPDVzJCwhsemeuBeoFGjEQc2rB7-qWIbuF-hRgBqlYs7hb5QvQ2mBHv-gG98o2kgmUldkVpw2dovAkyBQWIgQkqrOqmWcFolnwdwkEylXtkYZ5wU6DFAErSWNa5RxWaDXYRnAExBsPWXkW-5JbtzLZd7OQikFa2W8pkJ86p1PvZ_NT2jQ0i3ev0vx8IOHH2dwqlXciWpsiYefPPxcPjG3AsWCm6JaAy9efi0ttnCnwqTGHeTlNy-_l86slNZ2wTCqTfnDw5MSjJEUwOpO-dPDpb2KWKJteB_3vwDPNcyu';
watsonParam['id'] = 'cd9918487c30b30cc45fd666dd528eeb';
main(watsonParam);
*/
