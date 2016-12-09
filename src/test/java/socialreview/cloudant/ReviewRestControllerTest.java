package socialreview.cloudant;

import io.restassured.RestAssured;
import io.restassured.response.Response;

import static io.restassured.RestAssured.given;

import org.json.JSONArray;
import org.json.JSONObject;
import org.junit.Before;
import org.junit.FixMethodOrder;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.junit.runners.MethodSorters;

import static io.restassured.RestAssured.when;
import static org.junit.Assert.assertEquals;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.SpringBootTest.WebEnvironment;
import org.springframework.test.context.junit4.SpringRunner;

import java.util.HashMap;
import java.util.Map;
import java.util.Random;


@RunWith(SpringRunner.class)
@SpringBootTest(webEnvironment = WebEnvironment.RANDOM_PORT)

// So test execute in ascending name order
@FixMethodOrder(MethodSorters.NAME_ASCENDING)
public class ReviewRestControllerTest {

    @Value("${local.server.port}")
    private int serverPort;

    // Random itemId to keep track of generated review
    final static private int itemId = 10000 + new Random().nextInt(90000);
    // Rest of variables to for test review
    final static private String comment = "Best product ever";
    final static private int rating = 4;
    final static private String reviewer_email = "someone@somedomain.com";
    final static private String reviewer_name = "Some Person";
    final static private String review_date = "12/8/2016";

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
        jsonAsMap.put("comment", comment);
        jsonAsMap.put("itemId", itemId);
        jsonAsMap.put("rating", rating);
        jsonAsMap.put("reviewer_email", reviewer_email);
        jsonAsMap.put("reviewer_name", reviewer_name);
        jsonAsMap.put("review_date", review_date);

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
        String body_string = response.asString();

        // Body is an array of JSON objects
        JSONArray array = new JSONArray(body_string);

        // Confirm length is just one since previously created only one review for a unique itemId
        assertEquals(1, array.length());

        // Confirm the one review is the one we created
        JSONObject rev = array.getJSONObject(0);

        assertEquals(review_id, rev.getString("_Id"));
        assertEquals(comment, rev.getString("comment"));
        assertEquals(itemId, rev.getInt("itemId"));
        assertEquals(rating, rev.getInt("rating"));
        assertEquals(reviewer_email, rev.getString("reviewer_email"));
        assertEquals(reviewer_name, rev.getString("reviewer_name"));
        assertEquals(review_date, rev.getString("review_date"));

    }

}