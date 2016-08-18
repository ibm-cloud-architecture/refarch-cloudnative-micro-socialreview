package socialreview.cloudant;

//import org.codehaus.jackson.annotate.JsonIgnoreProperties;
//import org.codehaus.jackson.annotate.JsonProperty;
//import org.codehaus.jackson.annotate.JsonWriteNullProperties;

public class Review {

  private String _rev;
  private String _id;
  private String comment;
  private String itemId;
  private String rating;
  private String reviewer_email;
  private String reviewer_name;
  private String review_date;

  public Review(boolean isStub)
  {
    this.comment = "It works";
    this.itemId = "1204";
    this.rating = "4";
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
  public String getItemId() {
    return itemId;
  }
  public void setItemId(String itemId) {
    this.itemId = itemId;
  }
  public String getRating() {
    return rating;
  }
  public void setRating(String rating) {
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
    return "{ id: " + _id + ",\nrev: " + _rev + ",\n:itemId " + itemId
              + ",\n:reviewer_email " + reviewer_email + ",\n:reviewer_name " + reviewer_name + "\n}";
  }

}
