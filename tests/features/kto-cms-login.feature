Feature: KTO CMS Admin
  As an admin user
  I want to log in and navigate the admin sections
  So that I can manage the CMS and log out securely

  @login @smoke
  Scenario: Login, navigate admin sections, and logout
    Given I am on the login page
    When I log in with valid credentials
    Then I see the dashboard
    When I click the dashboard link
    And I navigate to "User Management"
    And I navigate to "Parental Controls"
    And I navigate to "Subscription"
    And I open push notifications
    And I log out
