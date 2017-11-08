package socialreview.cloudant;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix="cloudant")
public class CloudantConfig {

    private String username;
    private String password;
    private String host;

  public String getUsername() {
    return username;
  }

  public void setUsername(String username) {
    this.username = username;
  }

  public String getPassword() {
    return password;
  }

  public void setPassword(String password) {
    this.password = password;
  }

  public String getHost() {
    return host;
  }

  public void setHost(String host) {
    this.host = host;
  }

  @Override
  public String toString() {
    return username + " : " + password + ":" + host;
  }


}
