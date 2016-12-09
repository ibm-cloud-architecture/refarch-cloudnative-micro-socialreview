package socialreview.stage;

import com.sun.jersey.api.client.ClientResponse;
import com.sun.jersey.api.client.WebResource;
import com.sun.jersey.core.util.MultivaluedMapImpl;
import org.junit.Before;
import org.junit.Test;

import java.util.Random;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;


import org.json.*;

import com.sun.jersey.api.client.Client;

import javax.ws.rs.core.MultivaluedMap;

public class DeployTest {
    // Random itemId to keep track of generated review
    // Also having a random itemId allows us to retrieve only one review
    // which will improve the testing
    final static private int itemId = 10000 + new Random().nextInt(90000);
    // Rest of variables to for test review
    final static private String comment = "Best product ever";
    final static private int rating = 4;
    final static private String reviewer_email = "someone@somedomain.com";
    final static private String reviewer_name = "Some Person";
    final static private String review_date = "12/8/2016";

    // Variable to hold the created review id
    static private String review_id;
    static private Client client = Client.create();
    static private String service_url = System.getenv("service_url");
    static private WebResource webResource;


    @Before
    public void setup() throws Exception {
        service_url = (service_url != null) ? service_url : "";
        webResource = client.resource(service_url + "/micro/review");
    }

    @Test
    public void test_01_get_all_reviews() {
        ClientResponse response = webResource.accept("application/json").type("application/json").get(ClientResponse.class);
        assertEquals(200, response.getStatus());
    }

    @Test
    public void test_02_create_review() {
        // Build JSON Body for request
        // This is the actual review object to create
        JSONObject json = new JSONObject()
                .put("comment", comment)
                .put("itemId", itemId)
                .put("rating", rating)
                .put("reviewer_email", reviewer_email)
                .put("reviewer_name", reviewer_name)
                .put("review_date", review_date);

        // Perform POST call to create review
        ClientResponse response = webResource.
                accept("application/json").
                type("application/json").
                post(ClientResponse.class, json.toString());

        // Test that the response succeeded
        assertEquals(200, response.getStatus());

        // Convert response to string
        response.bufferEntity();
        String res_string = response.getEntity(String.class);

        // Make sure we get a review
        assertNotNull(res_string);

        // Save review id for next test
        review_id = res_string;
    }

    @Test
    public void test_03_get_created_review() {
        // Compose the query parameter
        MultivaluedMap queryParams = new MultivaluedMapImpl();
        queryParams.add("itemId", String.valueOf(itemId));

        // Perform the get request
        ClientResponse response = webResource
                .queryParams(queryParams)
                .accept("application/json")
                .type("application/json")
                .get(ClientResponse.class);

        // Verify we successfully queried
        assertEquals(200, response.getStatus());

        // Get response body as string
        response.bufferEntity();
        String body_string = response.getEntity(String.class);

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