package socialreview.cloudant;

//import org.codehaus.jackson.annotate.JsonIgnoreProperties;
//import org.codehaus.jackson.annotate.JsonProperty;
//import org.codehaus.jackson.annotate.JsonWriteNullProperties;

public class Review {

    private String _rev;
    private String _id;
    private String comment;
    private int itemId;
    private int rating;
    private String reviewer_email;
    private String reviewer_name;
    private String review_date;

    public Review() {
    }

    public Review(boolean isStub) {
        this.comment = "It works";
        this.itemId = 13401;
        this.rating = 5;
        this.reviewer_email = "gc@ibm.com";
        this.reviewer_name = "Gang";
        this.review_date = "08/18/2016";
    }

    public String get_Id() {
        return _id;
    }

    public void set_Id(String id) {
        this._id = id;
    }

    public String getComment() {
        return comment;
    }

    public void setComment(String comment) {
        this.comment = comment;
    }

    public int getItemId() {
        return itemId;
    }

    public void setItemId(int itemId) {
        this.itemId = itemId;
    }

    public int getRating() {
        return rating;
    }

    public void setRating(int rating) {
        this.rating = rating;
    }

    public String getReviewer_email() {
        return reviewer_email;
    }

    public void setReviewer_email(String reviewer_email) {
        this.reviewer_email = reviewer_email;
    }

    public String getReviewer_name() {
        return reviewer_name;
    }

    public void setReviewer_name(String reviewer_name) {
        this.reviewer_name = reviewer_name;
    }

    public String getReview_date() {
        return review_date;
    }

    public void setReview_date(String review_date) {
        this.review_date = review_date;
    }

    public String toString() {
        return "{\n\t_rev: " + _rev
                + ",\n\t_id: " + _id
                + ",\n\tcomment: " + comment
                + ",\n\titemId: " + itemId
                + ",\n\trating: " + rating
                + ",\n\treviewer_email: " + reviewer_email
                + ",\n\treviewer_name: " + reviewer_name
                + ",\n\treview_date: " + review_date
                + "\n}";
    }

}
