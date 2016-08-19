# Spring Boot Netflix OSS app Integration with IBM Cloudant

*This project is part of the 'IBM Cloud Native Reference Architecture' suite, available at
https://github.com/ibm-solution-engineering/refarch-cloudnative*

## Introduction

This project is built to demonstrate how to build a Spring Boot Microservices application to access IBM Cloudant NoSQL database. It provides basic operations of saving and querying reviews from database as part of Social Review function. The project covers following technical areas:

 - Leverage Spring Boot framework to build Microservices application
 - Use IBM Cloudant official Java client API to access Cloudant database
 - Integrate with Netflix Eureka framework
 - Deployment option for IBM Bluemix Cloud Foundry and Container compute runtime



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

 	`$ ./gradlew build`

 - To run the app:

 	`$ java -jar build/libs/micro-soialreview-0.1.0.jar`

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
 The scripts is validated with docker verion 1.10.x

- Build all docker images  
     `$ docker-compose build`
