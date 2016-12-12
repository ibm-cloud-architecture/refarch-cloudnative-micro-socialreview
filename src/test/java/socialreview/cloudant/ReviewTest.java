package socialreview.cloudant;

import org.junit.Test;
import static org.junit.Assert.*;

public class ReviewTest {

    @Test
    public void stubTest() throws Exception {
        // Uses the built in stub review
        Review rev = new Review(true);

        assertNull(rev.get_Id());
        assertEquals(rev.getComment(), "It works");
        assertEquals(rev.getItemId(), 13401);
        assertEquals(rev.getRating(), 5);
        assertEquals(rev.getReviewer_email(), "gc@ibm.com");
        assertEquals(rev.getReviewer_name(), "Gang");
        assertEquals(rev.getComment(), "It works");
    }

    @Test
    public void toStringTest() throws Exception {
        // Uses the built-in stub review
        Review rev = new Review(true);
        String revString = rev.toString();

        // Build test JSON
        StringBuilder testJSON = new StringBuilder();
        testJSON.append("{\n");
        testJSON.append("\t").append("_rev: ").append("null").append(",\n");
        testJSON.append("\t").append("_id: ").append("null").append(",\n");
        testJSON.append("\t").append("comment: ").append(rev.getComment()).append(",\n");
        testJSON.append("\t").append("itemId: ").append(rev.getItemId()).append(",\n");
        testJSON.append("\t").append("rating: ").append(rev.getRating()).append(",\n");
        testJSON.append("\t").append("reviewer_email: ").append(rev.getReviewer_email()).append(",\n");
        testJSON.append("\t").append("reviewer_name: ").append(rev.getReviewer_name()).append(",\n");
        testJSON.append("\t").append("review_date: ").append(rev.getReview_date()).append(",\n");
        testJSON.append("}");

        // Get the test JSON string
        String jsonString = testJSON.toString();

        // Make sure the strings are equal
        assertEquals(revString, jsonString);
    }
}