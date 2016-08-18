package socialreview.cloudant;

//import org.ektorp.CouchDbConnector;
//import org.ektorp.support.CouchDbRepositorySupport;
//import org.springframework.beans.factory.annotation.Autowired;
//import org.springframework.stereotype.Component;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.ResponseBody;

import com.cloudant.client.api.CloudantClient;
import com.cloudant.client.api.Database;

@RestController
@RequestMapping("/review")
public class ReviewRestController {

  @Autowired
  private Database db;

  @RequestMapping(method=RequestMethod.GET)
  public @ResponseBody Review getAll() {

    //db.save(new Review(true));
    Review doc = db.find(Review.class,"111");
    //return doc.toString();
    return doc;
  }


}
