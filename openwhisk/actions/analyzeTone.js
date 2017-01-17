var request = require('request-promise');
var process = require('process');

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

    if (!param.cloudant_staging_db) {
        whisk.error('cloudant staging db is required.');
        return;
    }

    var cloudant = require('cloudant')({
        url: cloudantUrl,
        plugin:'default'
    });

    return cloudant;
}

function analyzeText(params) {
    var watsonURL = params.watson_url + "/v3/tone?version=2016-05-19"
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
    }

    return request(requestOptions).
        then(function(parsedBody) {
            console.log(parsedBody, null, 4);
            params['analysis'] = parsedBody;

            return Promise.resolve(params);

        }).
        catch(function(err) {
            console.log("error! ", err);

            return err;
        });
}

function getCloudantChange(params) {
    var dbName = params.dbName;
    var cloudant = params.cloudant;

    return new Promise(function(resolve, reject) {
        var cloudantdb = cloudant.db.use(dbName);
        cloudantdb.get(params.id, function(error, response) {
            console.log(response);

            if (!error) {
                console.log('success', response);
                params['review'] = response;
                resolve(params);
            } else {
                console.error('error', error);
                reject(error);
            }
        });
    });
}

function getDatabase(params) {
    var cloudant = params.cloudant;
    var review = params.review;
    var dbName = params.cloudant_reviews_db;
    console.log('getDatabase:');

    return new Promise(function(resolve, reject) {
        console.log("Getting database: ", dbName);
        cloudant.db.get(dbName, function(error, response) {
            if (!error) {
                console.log('success: database found', response);
                params['createDatabase'] = false;
                resolve(params);
                return;
            } else if (error.statusCode == 404) {
                console.log('database ', dbName, ' was not found, will attempt to create ...');
                params['createDatabase'] = true;
                resolve(params);
                return;
            }

            console.error('Unable to get database: ', error);
            reject(error);
        });
    });

}

function createDatabase(params) {
    var cloudant = params.cloudant;
    var dbName = params.cloudant_reviews_db;

    return new Promise(function(resolve, reject) {
        if (params.createDatabase == false) {
            console.log('Database already exists, inserting record ...');
            resolve(params);
            return;
        }

        console.log("Creating database: ", dbName);

        cloudant.db.create(dbName, function(error, response) {
            if (!error) {
                console.log('success', response);
                resolve(params);
            } else {
                console.log('error', error);
                reject(error);
            }
        });
    });
}

function getIndex(params) {
    var cloudant = params.cloudant;
    var dbName = params.cloudant_reviews_db;

    return new Promise(function (resolve, reject) {
        var cloudantdb = cloudant.db.use(dbName);

        cloudantdb.index(function (er, result) {
            params['indexExists'] = false;
            if (er) {
                reject(er);
            }

            console.log('The database has %d indexes', result.indexes.length);
            for (var i = 0; i < result.indexes.length; i++) {
                if (result.indexes[i].name == 'itemIdIndex') {
                    params['indexExists'] = true;
                }
                console.log('  %s (%s): %j', result.indexes[i].name, result.indexes[i].type, result.indexes[i].def);
            }           


            resolve(params);
        });
    });


}

function createIndex(params) {
    var cloudant = params.cloudant;
    var dbName = params.cloudant_reviews_db;

    return new Promise(function (resolve, reject) {
        if (params['indexExists'] == true) {
            console.log("index already exists, inserting record");
            resolve(params);
            return;
        }

        var item_indexer = function(doc) {
            if (doc.itemId) {
                index('itemId', doc.itemId);
            }
        };

        var ddoc = {
            _id: '_design/itemIdIndex',
            language: "query",
            views: {
                itemIdIndex: {
                    map: {
                        fields: {
                            itemId: "asc"
                        }
                    },
                    reduce: "_count",
                    options: {
                        def: {
                            fields: [
                                "itemId"
                            ]
                        }
                    }
                }
            }        
        };

        var cloudantdb = cloudant.db.use(dbName);

        cloudantdb.insert(ddoc, function (er, result) {
            if (er) {
                reject(er);
            }
            console.log("Created itemId index");

            resolve(params);

        });
    });

}

function insertRecord(params) {
    var cloudant = params.cloudant;
    var dbName = params.cloudant_reviews_db;
    var review = params.review;
    console.log(params);

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
    console.log("params:", params);

    var cloudantOrError = getCloudantCredential(params);
    if (typeof cloudantOrError !== 'object') {
        return whisk.error('getCloudantAccount returned an unexpected object type.');
    }

    var cloudant = cloudantOrError;
    var options = params;
    options['dbName'] = params.cloudant_staging_db;
    options['cloudant'] = cloudant;

    return Promise.resolve(options)
        .then(getCloudantChange)
        .then(analyzeText)
        .then(getDatabase)
        .then(createDatabase)
        .then(getIndex)
        .then(createIndex)
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
