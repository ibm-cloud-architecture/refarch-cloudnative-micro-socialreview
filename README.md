# Spring Boot Netflix OSS app Integration with IBM Cloudant

*This project is part of the 'IBM Cloud Native Reference Architecture' suite, available at
https://github.com/ibm-cloud-architecture/refarch-cloudnative*

## Introduction

This project is built to demonstrate how to build a Spring Boot Microservices application to access IBM Cloudant NoSQL database. It provides basic operations of saving and querying reviews from database as part of Social Review function. The project covers following technical areas:

 - Leverage Spring Boot framework to build Microservices application
 - Use IBM Cloudant official Java client API to access Cloudant database
 - Integrate with Netflix Eureka framework
 - Deployment option for IBM Bluemix Cloud Foundry and Container compute runtime

## Provision Cloudant Database in Bluemix:

Login to your Bluemix console  
Open browser to create Cloudant Service using this link [https://new-console.ng.bluemix.net/catalog/services/cloudant-nosql-db](https://new-console.ng.bluemix.net/catalog/services/cloudant-nosql-db)  
Name your Cloudant service name like `refarch-cloudantdb`  
For testing, you can select the "Shared" plan, then click "Create"  
Once created, open the credential tab to note down your Cloudant Service credential, for example:

```
{
 "username": "3xxxx-44f0d2add79e-bluemix",
 "password": "xxxxxxxxxxxxxxxxxxxxxx",
 "host": "xxxxx-bluemix.cloudant.com",
 "port": 443,
 "url": "https://xxxxx-bluemix.cloudant.com"
}
```
Then, click the "Launch" button to open the Cloudant management console.   

You can close the console now.

## Run the application locally:

 - Create Cloudant database

 You can either use Cloudant local or IBM Cloudant managed account. Once you have cloudant setup, update the src/resources/application.yml file for the Cloudant credential:

   ```yml
   # Cloudant Confiugration
   cloudant:
    username: {your_cloudant_username}
    password: {your_cloudant_password}
    host: {your_cloudant_host}
    ```

 - Run following command to build the application:

 	`$ ./gradlew build -x test`

 - To run the app:

 	`$ java -jar build/libs/micro-soialreview-0.1.0.jar`

 - To run integration test case:

  `$ ./gradlew test`  

 - Validate the application

     [http://localhost:8080/micro/review](http://localhost:8080/micro/review)

     This will return all the reviews in the database.
     You can use Chrome POSTMAN to insert a new review document. Use the following sample content:

     ```json
     {
        "comment": "Nice Product",
        "itemId": 13402,
        "rating": 5,
        "reviewer_email": "gangchen@us.ibm.com",
        "reviewer_name": "Gang Chen",
        "review_date": "06/08/2016"
    }
    ```


## Deploy to local Docker environment

 Ensure that you have local docker environment setup properly. The solution requires docker-compose.
 The scripts is validated with docker version 1.11.x

- Copy the Application binary to docker folder:

     `$ ./gradlew docker`

     This will copy the Spring boot jar file to the docker folder, and rename it to app.jar

- Build the docker image:

    `$ cd docker`  
    `$ docker build -t cloudnative/socialreviewservice .`

- Run the local docker image

    `$ docker run -d -p 8080:8080 --name socialreview cloudnative/socialreviewservice`

    You can validate the docker application at:

    [http://{dockerhost}:8080/micro/review](http://{dockerhost}:8080/micro/review)

    Replace the {dockerhost} with your docker hostname or IP address.

## Deploy to Bluemix Container Runtime

 Ensure that you have the Bluemix Container service setup properly, with a valid private Docker registry namespace. You need also ensure having the Bluemix cf or bx command line as well as container plugin installed. Please follow this link to setup: https://new-console.ng.bluemix.net/docs/cli/index.html#cli

 - Tag and Push the microservice docker image to Bluemix registry

     `$ cf login`  
     `$ cf ic login`  
     `$ docker tag cloudnative/socialreviewservice   registry.ng.bluemix.net/{yournamespace}/socialreviewservice`  
     `$ docker push registry.ng.bluemix.net/{yournamespace}/socialreviewservice`  

     Replace the {yournamespace} variable with your Bluemix private registry namespace. If you don't have one, create with following command:

     `cf ic namespace get`

     If issuing `cf ic images` command, you should see your image in Bluemix.

 - Create a container group for the image

     Bluemix container group is a scalable Docker contianer runtime where auto-recovery and auto-scaling service are provided. Use the following command to create the container group for the microservice:

     `cf ic group create -p 8080  -m 512 --min 1 --auto --name micro-socialreview-group -n socialreviewservice -d mybluemix.net registry.ng.bluemix.net/{yournamespace}/socialreviewservice`

     You can view your container instance with following command:
     `cf ic ps`

     Or you can log on to Bluemix console to review container instances under the Compute/Containers tab.

 - Validate the deployed container

   Open your browser to the URL matches your Container group route:

   [http://socialreviewservice.mybluemix.net/micro/review](http://socialreviewservice.mybluemix.net/micro/review)
