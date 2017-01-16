
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

function getRecord(cloudantdb, id) {
    cloudantdb.index(function(err, result) {
        if (err) {
            console.log(err);
            throw err;

        }
        console.log('Indexes:', result);
    });

    return new Promise(function(resolve, reject) {
        console.log('find documents with id: ', id);

        // show me the indexes

        cloudantdb.find({selector: { itemId: id }}, 
            function(err, result) {
                if (err) {
                    if (err.statusCode != 404) {
                        // if error code is not found, it's not really an error
                        // as the record doesn't exist yet.  otherwise, fail the operation
                        reject(err);
                    }
                }

                resolve(result);
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
  * In this case, the params variable will look like:
  *     { "message": "xxxx" }
  *
  * @return which must be a JSON object.
  *         It will be the output of this action.
  *
  */
function main(params) {
    console.log(params);
    var id = parseInt(params.itemId);

    // TODO: create table, index, design doc

    var cloudantOrError = getCloudantCredential(params);
    if (typeof cloudantOrError !== 'object') {
        return whisk.error('getCloudantAccount returned an unexpected object type.');
    }

    var cloudantdb = cloudantOrError;

    // read profile from cloudant DB
    return getRecord(cloudantdb, id).then(function (data) {
        //console.log("the answer:", data.docs);
        return data;
    });
}

