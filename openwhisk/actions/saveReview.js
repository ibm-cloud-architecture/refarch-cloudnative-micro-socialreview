
var Promise = require('promise');

function getCloudantCredential(param) {
    var cloudantUrl;

    if (param.url) {
        // use bluemix binding
        cloudantUrl = param.url;
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

    if (!param.db) {
        whisk.error('cloudant db is required.');
        return;
    }

    var cloudant = require('cloudant')({
        url: cloudantUrl,
        plugin:'default'
    });

    return cloudant.db.use(param.db);
}

function insertRecord(params) {

    var cloudantdb = params.cloudantdb;
    var review = params.review;

    return new Promise(function(resolve, reject) {
        console.log("inserting review: ", review);
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

    var cloudantdb = cloudantOrError;

    // write each message to cloudant DB
    Promise.resolve({
        cloudantdb: cloudantdb,
        review: review
    }).then(insertRecord)
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

