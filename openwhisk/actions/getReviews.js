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

    return cloudant.db.use(param.cloudant_reviews_db);
}

function getRecord(cloudantdb, id) {
    /*
    cloudantdb.index(function(err, result) {
        if (err) {
            console.log(err);
            throw err;

        }
        console.log('Indexes:', result);
    });
    */

    return new Promise(function(resolve, reject) {
        console.log('find documents with id: ', id);

        // query the view, passing the id
        cloudantdb.view('unflaggedByItemId', 'itemIdIndex', { keys: [ id ] }, 
            function(err, result) {
                console.log(result);
                if (err) {
                    reject(err);
                }

                var docs = [];
                for (i = 0; i < result.rows.length; i++) {
                    docs.push(result.rows[i].value);
                }

                resolve({docs: docs});
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

    var cloudantOrError = getCloudantCredential(params);
    if (typeof cloudantOrError !== 'object') {
        return whisk.error('getCloudantAccount returned an unexpected object type.');
    }

    var cloudantdb = cloudantOrError;

    // read profile from cloudant DB
    return getRecord(cloudantdb, id).then(function (data) {
        //console.log("the answer:", data.docs);
        for (i = 0; i < data.docs.length; i++) {
            var doc = data.docs[i];
            delete doc._id;
            delete doc.analysis;
            delete doc._rev;
        }
        return data;
    });
}

