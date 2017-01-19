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
        whisk.error('cloudant staging db is required.');
        return;
    }

    var cloudant = require('cloudant')({
        url: cloudantUrl,
        plugin:'default'
    });

    return cloudant;
}

function getStagingDatabase(params) {
    params['dbname'] = params.cloudant_reviews_db + '-staging';

    return _getDatabase(params);
}

function createStagingDatabase(params) {
    params['dbname'] = params.cloudant_reviews_db + '-staging';

    return _createDatabase(params);
}

function getFlaggedDatabase(params) {
    params['dbname'] = params.cloudant_reviews_db + '-flagged';

    return _getDatabase(params);
}

function createFlaggedDatabase(params) {
    params['dbname'] = params.cloudant_reviews_db + '-flagged';

    return _createDatabase(params);
}

function getDatabase(params) {
    params['dbname'] = params.cloudant_reviews_db;

    return _getDatabase(params);
}

function createDatabase(params) {
    params['dbname'] = params.cloudant_reviews_db;

    return _createDatabase(params);
}

function _getDatabase(params) {
    var cloudant = params.cloudant;
    var dbName = params.dbname;

    console.log('getDatabase: ', dbName);

    return new Promise(function(resolve, reject) {
        console.log("Getting database: ", dbName);
        cloudant.db.get(dbName, function(error, response) {
            if (!error) {
                console.log('success: database found', response);
                params['createDatabase'] = false;
                resolve(params);
            } else {
                // 404 means database doesn't exist
                if (error.statusCode == 404) {
                    console.log('database ', dbName, ' was not found, will attempt to create ...');
                    params['createDatabase'] = true;
                    resolve(params);
                    return;
                }

                console.error('Unable to get database: ', error);
                reject(error);
            }
        });
    });
}

function _createDatabase(params) {
    var cloudant = params.cloudant;
    var review = params.review;
    var dbName = params.dbname;

    return new Promise(function(resolve, reject) {
        if (params.createDatabase == false) {
            console.log('Database ', dbName, ' already exists');
            delete params.createDatabase;
            resolve(params);
            return;
        }

        console.log("Creating database: ", dbName);

        cloudant.db.create(dbName, function(error, response) {
            if (!error) {
                console.log('success', response);
                delete params.createDatabase;

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
            console.log("index already exists");
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

function main(params) {
    console.log("params:", params);

    var cloudantOrError = getCloudantCredential(params);

    if (typeof cloudantOrError !== 'object') {
        return whisk.error('getCloudantAccount returned an unexpected object type.');
    }

    var cloudant = cloudantOrError;
    params['cloudant'] = cloudant;

    return Promise.resolve(params)
        .then(getStagingDatabase)
        .then(createStagingDatabase)
        .then(getFlaggedDatabase)
        .then(createFlaggedDatabase)
        .then(getDatabase)
        .then(createDatabase)
        .then(getIndex)
        .then(createIndex)
        .then(function(data) {
            return { 
                result: "OK"
            };
        })
        .catch(function(error) {
            return {
                result: "error",
                error: error
            }
        });
}
