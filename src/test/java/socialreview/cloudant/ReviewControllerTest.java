package socialreview.cloudant;

import static org.hamcrest.Matchers.equalTo;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import org.springframework.test.context.ContextConfiguration;
import org.springframework.web.context.WebApplicationContext;

import static org.hamcrest.Matchers.equalTo;
import static org.junit.Assert.assertThat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.net.URL;

import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.ResponseEntity;
import org.springframework.test.context.junit4.SpringJUnit4ClassRunner;
import org.springframework.test.context.web.WebAppConfiguration;

import com.cloudant.client.api.CloudantClient;
import com.cloudant.client.api.ClientBuilder;
import com.cloudant.client.api.Database;

import org.hamcrest.core.IsNull;
import static org.hamcrest.CoreMatchers.*;
import org.springframework.beans.factory.annotation.Autowired;

@RunWith(SpringJUnit4ClassRunner.class)
//@SpringBootTest
//@ContextConfiguration(locations = {"classpath*:resource/application.yml"})
@SpringBootTest(classes=Application.class)
public class ReviewControllerTest {

	private MockMvc mvc;
    private int port = 8080;

    private URL base;
    private TestRestTemplate template;

		@Autowired
		private WebApplicationContext webAppContext;

		@Autowired
	 private Database db;

	@Before
	public void setUp() throws Exception {
		//mvc = MockMvcBuilders.standaloneSetup(new ReviewRestController()).build();
		//mvc = MockMvcBuilders.standaloneSetup().build();
		this.base = new URL("http://localhost:" + port + "/micro/review");
        template = new TestRestTemplate();

	}

	@Test
	public void getHello() throws Exception {

			System.out.println("Execute the test gettingAll");

			ResponseEntity<String> response = template.getForEntity(base.toString(), String.class);
      assertThat( response.getStatusCode() , equalTo(HttpStatus.OK));
	}
}
