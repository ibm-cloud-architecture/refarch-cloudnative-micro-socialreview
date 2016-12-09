package socialreview.cloudant;

import io.restassured.RestAssured;
import io.restassured.response.Response;

import static io.restassured.RestAssured.given;

import org.junit.Before;
import org.junit.FixMethodOrder;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.junit.runners.MethodSorters;

import static io.restassured.RestAssured.when;
import static org.junit.Assert.assertThat;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.SpringBootTest.WebEnvironment;
import org.springframework.test.context.junit4.SpringRunner;

import java.util.HashMap;
import java.util.Map;
import java.util.Random;

import static org.hamcrest.core.StringContains.containsString;


@RunWith(SpringRunner.class)
@SpringBootTest(webEnvironment = WebEnvironment.RANDOM_PORT)

// So test execute in ascending name order
@FixMethodOrder(MethodSorters.NAME_ASCENDING)
public class ReviewRestControllerTest {

    @Value("${local.server.port}")
    private int serverPort;

    // Random itemId to keep track of generated review
    final static private int itemId = 10000 + new Random().nextInt(90000);

    // Variable to hold the created review id
    static private String review_id;

    @Before
    public void setup() throws Exception {
        RestAssured.port = serverPort;
    }

    @Test
    public void test_01_get_all_reviews() {
        when().
                get("/micro/review").
        then().
                statusCode(200);
    }

    @Test
    public void test_02_create_review() {
        // Build test JSON
        Map<String, Object> jsonAsMap = new HashMap<>();
        jsonAsMap.put("comment", "Best product ever");
        jsonAsMap.put("itemId", itemId);
        jsonAsMap.put("rating", 4);
        jsonAsMap.put("reviewer_email", "someone@somedomain.com");
        jsonAsMap.put("reviewer_name", "Some Person");
        jsonAsMap.put("review_date", "12/8/2016");

        // Create Review
        Response response =
        given().
                contentType("application/json").
                header("accept", "application/json").
                body(jsonAsMap).
        when().
                post("/micro/review").
        then().
                statusCode(200).
        extract().
                response();

        // Save review id for future test
        review_id = response.asString();
    }

    @Test
    public void test_03_get_created_review() {
        Response response =
        given().
                param("itemId", itemId).
        when().
                get("/micro/review").
        then().
                statusCode(200).
        extract().
                response();

        // Find the review id in the JSON string
        String json = response.asString();
        assertThat(json, containsString(review_id));

    }

}