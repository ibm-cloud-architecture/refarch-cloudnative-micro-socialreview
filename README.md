# Social Review Microservice implemented with OpenWhisk actions

*This project is part of the 'IBM Cloud Native Reference Architecture' suite, available at
https://github.com/ibm-cloud-architecture/refarch-cloudnative*

## Introduction

This project is built to demonstrate how to build a Microservices application implemented as [OpenWhisk](http://openwhisk.org/) actions to access [IBM Cloudant](https://cloudant.com/) NoSQL database. It provides basic operations of saving and querying reviews from a database as part of the Social Review function of BlueCompute. Additionally, the review text is analyzed using the [Watson Tone Analyzer](https://www.ibm.com/watson/developercloud/tone-analyzer.html) service to determine whether to flag negative reviews for further insepection.  The project covers following technical areas:

 - Leverage [OpenWhisk actions](https://github.com/openwhisk/openwhisk/blob/master/docs/actions.md) and [REST API gateway](https://github.com/openwhisk/openwhisk/blob/master/docs/apigateway.md) to build a Serverless Microservices application
 - Use [IBM Cloudant NodeJS library](https://github.com/cloudant/nodejs-cloudant) to access Cloudant database
 - Use [OpenWhisk triggers](https://github.com/openwhisk/openwhisk/blob/master/docs/triggers_rules.md) to fire an OpenWhisk action on Cloudant database change
 - Use [Watson Tone Analyzer REST API](https://www.ibm.com/watson/developercloud/tone-analyzer/api/v3/) to analyze text.
 
![Social Review component Diagram](socialreview-openwhisk.png)

## Pre-requisites
 
### Provision Cloudant Database in Bluemix

1. Login to your Bluemix console  
2. Open browser to create Cloudant Service using this link [https://console.ng.bluemix.net/catalog/services/cloudant-nosql-db](https://console.ng.bluemix.net/catalog/services/cloudant-nosql-db)  
3. Name your Cloudant service name like `refarch-cloudantdb`  
4. For testing, you can select the "Shared" plan, then click "Create"  
5. Once the service has been created, note the service credentials under `Service Credentials`.  In particular, the Social Review microservice requires the `url` property.

### Provision Watson Tone Analyzer in Bluemix

1. Login to your Bluemix console
2. Open browser to create the Watson Tone Analyzer service using this link [https://console.ng.bluemix.net/catalog/services/tone-analyzer/](https://console.ng.bluemix.net/catalog/services/tone-analyzer/)
3. Name your Watson Tone Analyzer service like `refarch-watson-tone-analyzer`
4. For testing, you can select the "standard" plan, then click "Create"
5. Once the service has been created, note the service credentials under `Service Credentials`.  In particular, the Social Review microservice requires the `username`, `password`, and `url` properties.

## Deploy to BlueMix

You can use the following button to deploy the Social Review microservice to Bluemix, or you can follow the instructions manually below.

[![Create BlueCompute Deployment Toolchain](https://console.ng.bluemix.net/devops/graphics/create_toolchain_button.png)](https://console.ng.bluemix.net/devops/setup/deploy?repository=https://github.com/ibm-cloud-architecture/refarch-cloudnative-micro-socialreview.git)

## Download and configure the OpenWhisk CLI

1. Download the OpenWhisk CLI for your platform from this link [https://console.ng.bluemix.net/openwhisk/cli](https://console.ng.bluemix.net/openwhisk/cli)
2. In the above link, copy the command to configure the OpenWhisk CLI and paste it into a terminal window.  Ensure that you have selected the Bluemix org and space corresponding to where the Cloudant service was created.
3. Run the following to automatically create OpenWhisk packages with the Cloudant credentials in your space:

   ```
   # wsk package refresh
   ```

   This should result in a package containing your Cloudant database credentials.  An example of the package is shown below:
   ```
   # wsk package list
   packages
   /<org>_<space>/Bluemix_refarch-cloudantdb_refarch-cloudantdb-credential private
   ```
   
## Deploy the OpenWhisk package and actions

1. Use the OpenWhisk CLI to create a `socialreview` package.  Pass the `url` property from the Cloudant service instance created, and the `username`, `password`, and `url` properties from the Watson Tone Analyzer service instance.

   ```
   # wsk package create socialreview --param cloudant_url <cloudant url> \
   --param watson_url <watson tone analyzer url> \
   --param watson_username <watson tone analyzer username> \
   --param watson_password <watson tone analyzer password \
   --param cloudant_reviews_db socialreviewdb
   ```

2. Upload all of the actions under the created package.  All of the actions in the package inherit the properties we created in the package (`cloudant_url`, `watson_url`, `watson_username`, `watson_password`, `cloudant_reviews_db`):

   ```
   # wsk action create socialreview/initCloudant openwhisk/actions/initCloudant.js
   # wsk action create socialreview/saveReview openwhisk/actions/saveReview.js
   # wsk action create socialreview/getReviews openwhisk/actions/getReviews.js
   # wsk action create socialreview/analyzeTone openwhisk/actions/analyzeTone.js
   ```
   
3. Execute the initCloudant OpenWhisk action to create the Cloudant databases and indexes required by the Social Review microservice.
   ```
   # wsk action invoke socialreview/initCloudant --blocking
   ```

4. Create the OpenWhisk REST API gateway for the OpenWhisk actions. This exposes two of the OpenWhisk actions as REST API.
   
   ```
   # wsk api-experimental create /api /reviews/list get socialReview/getReviews
   # wsk api-experimental create /api /reviews/comment post socialReview/saveReview
   ```

5. Create an OpenWhisk trigger called `reviewTrigger` on the Cloudant database `socialreviewdb`.  This uses the Whisk built-in trigger from the generated Cloudant package.

   ```
   # wsk trigger create reviewTrigger --feed /<org>_<space>/Bluemix_refarch-cloudantdb_refarch-cloudantdb-credential/changes --param dbname socialreviewdb
   ```
   
6. Create a rule that fires the `analyzeTone` action when `reviewTrigger` is triggered.  This analyzes the text of posted reviews and uses the output to decide whether to unflag the review so it is returned by the API:

   ```
   # wsk rule create handleReviewPosted reviewTrigger socialreview/analyzeTone
   ```

## Verify the Social Review Microservice

1. Check the created OpenWhisk endpoints, for example:
   ```
   # wsk api-experimental list
   ok: APIs
   Action                            Verb             API Name  URL
   /cent@us.ibm.com_jkwong-dev/socialreview/getReviews     get                 /api  https://d7af58f0-6cdc-4a52-b436-f98991dc09c9-gws.api-gw.mybluemix.net/api/reviews/list
   /cent@us.ibm.com_jkwong-dev/socialreview/saveReview    post                 /api  https://d7af58f0-6cdc-4a52-b436-f98991dc09c9-gws.api-gw.mybluemix.net/api/reviews/comment
   ```

2. In another terminal window, start the OpenWhisk monitor:
   ```
   # wsk activation poll
   ```
   
   This will print log messages when actions are executed.  Alternatively, you can monitor OpenWhisk from the [dashboard)(https://console.ng.bluemix.net/openwhisk/dashboard)
   
3. Create a positive review using the API:
   ```
   # curl -X POST -H "Content-Type: application/json" -d '{ "comment": "I love this product!", "rating": 5, "reviewer_name": "Jeffrey Kwong", "review_date": "01/19/2016", "reviewer_email": "jkwong@ca.ibm.com"}' https://d7af58f0-6cdc-4a52-b436-f98991dc09c9-gws.api-gw.mybluemix.net/api/reviews/comment?itemId=13402
   {
     "result": "OK",
     "message": {
       "ok": true,
       "id": "2c9bbcb0e2ecb459cd5582bb74c33976",
       "rev": "1-989bc5220f686df99cda0b3e54339614"
   }
   ```
   
   Observe in the OpenWhisk monitor: 
   - the `saveReview` action is called, which saves the review to the `socialreviewdb` database, initially flagging it.
   - the `reviewTrigger` is fired, 
   - which triggers the `handleReviewPosted` rule, 
   - which executes the `analyzeTone` action.  the review text, "I love this product!", is analyzed and determined to be positive, and the comment is unflagged and updated into the `socialreviewdb` database with the JSON document returned by the Watson Tone Analyzer attached.
   - You will notice that since the record was updated, that the trigger is fired again, but since the record was already analyzed (the `analysis` property is non-null), no further processing is performed.
   
4. Call the GET API to get the reviews for the item:
   ```
   # curl -X GET -H "Accept: application/json" https://d7af58f0-6cdc-4a52-b436-f98991dc09c9-gws.api-gw.mybluemix.net/api/reviews/list?itemId=13402
   {
     "docs": [{
       "reviewer_email": "jkwong@ca.ibm.com",
       "review_date": "01/20/2016",
       "rating": 5,
       "comment": "I love this product!",
       "itemId": 13402,
       "reviewer_name": "Jeffrey Kwong"
     }]
   }
   ```
    
5. Now submit a negative review:
   ```
   # curl -X POST -H "Content-Type: application/json" -d '{ "comment": "I hate this product!", "rating": 1, "reviewer_name": "Jeffrey Kwong", "review_date": "01/19/2016", "reviewer_email": "jkwong@ca.ibm.com"}' https://d7af58f0-6cdc-4a52-b436-f98991dc09c9-gws.api-gw.mybluemix.net/api/reviews/comment?itemId=13402
   {
     "result": "OK",
     "message": {
       "ok": true,
       "id": "5d87b49f0f63ed5be2da39507db991ad",
       "rev": "1-56d0e7d249bec7ef6bbe557a47a970fd"
     }
   }
   ```

6. Observe in the OpenWhisk monitor that the same sequence is fired, but the review comment text is determined to be `angry` and the review remains flagged in the dataabase.  In the Cloudant management portal, you can observe that the `socialreviewdb` table contains the all analyzed reviews with the Watson Tone Analyzer analysis JSON document attached.
