var Promise = require('promise');

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

function getDatabase(params) {
    var cloudant = params.cloudant;
    var review = params.review;
    var dbName = params.dbName;
    console.log('getDatabase:');

    return new Promise(function(resolve, reject) {
        console.log("Getting database: ", dbName);
        cloudant.db.get(dbName, function(error, response) {
            if (!error) {
                console.log('success: database found', response);
                resolve({
                    cloudant: cloudant,
                    review: review,
                    dbName: dbName,
                    createDatabase: false
                });
            } else {
                // TODO: 404?
                if (error.statusCode == 404) {
                    console.log('database ', dbName, ' was not found, will attempt to create ...');
                    resolve({
                        cloudant: cloudant,
                        review: review,
                        dbName: dbName,
                        createDatabase: true
                    });
                    return;
                }

                console.error('Unable to get database: ', error);
                reject(error);
            }
        });
    });

}

function createDatabase(params) {
    var cloudant = params.cloudant;
    var review = params.review;
    var dbName = params.dbName;

    return new Promise(function(resolve, reject) {
        if (params.createDatabase == false) {
            console.log('Database already exists, inserting record ...');
            resolve({
                cloudant: cloudant,
                review: review,
                dbName: dbName
            });
            return;
        }

        console.log("Creating database: ", dbName);

        cloudant.db.create(dbName, function(error, response) {
            if (!error) {
                console.log('success', response);
                resolve({
                    cloudant: cloudant,
                    review: review,
                    dbName: dbName
                });
            } else {
                console.log('error', error);
                reject(error);
            }
        });
    });

}

function insertRecord(params) {
    var cloudant = params.cloudant;
    var review = params.review;
    var dbName = params.dbName;

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

/**
  *
  * main() will be invoked when you Run This Action.
  * 
  * @param Whisk actions accept a single parameter,
  *        which must be a JSON object.
  *
  * @return which must be a JSON object.
  *         It will be the output of this action.
  *
  */
function main(params) {
    var review = {
        itemId: parseInt(params.itemId),
        review_date: params.review_date,
        rating: params.rating,
        reviewer_name: params.reviewer_name,
        reviewer_email: params.reviewer_email,
        comment: params.comment
    }; 

    console.log("saveReview triggered, review: ", review);

    // TODO: create table, index, design doc

    var cloudantOrError = getCloudantCredential(params);
    if (typeof cloudantOrError !== 'object') {
        return whisk.error('getCloudantAccount returned an unexpected object type.');
    }

    var cloudant = cloudantOrError;

    // write each message to cloudant staging DB
    return Promise.resolve({
        cloudant: cloudant,
        review: review,
        dbName: params.cloudant_staging_db
    })
      .then(getDatabase)
      .then(createDatabase)
      .then(insertRecord)
      .then(function (body) {
        return {
            'result': 'OK',
            'message': body
        };
      })
      .catch(function (error) {
        return {
            'result': 'ERROR' ,
            'message': error
        };
    });
}

/*
var fs = require('fs');
var paramsStr = fs.readFileSync('socialReviewParams.json');
var params = JSON.parse(paramsStr);

params['itemId'] = 13401;
params['rating'] = 2;
params['reviewer_name'] = 'Jeffrey Kwong';
params['comment'] = 'Not so good';

main(params);
*/
