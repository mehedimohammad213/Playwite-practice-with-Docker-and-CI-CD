import { test, expect } from "@playwright/test";
import { API_BASE_URL, TEST_USER } from "../support/test-data";

test.describe("POST /api/v1/users/login", () => {
  test("returns access token and user on valid credentials", async ({
    request,
  }) => {
    const response = await request.post(
      `${API_BASE_URL}/api/v1/users/login`,
      {
        data: {
          email: TEST_USER.email,
          password: TEST_USER.password,
        },
      },
    );

    expect(response.status()).toBe(200);

    const body = await response.json();

    expect(body).toMatchObject({
      statusCode: 200,
      success: true,
      message: "Logged in successfully",
    });

    expect(body.data.accessToken).toEqual(expect.any(String));
    expect(body.data.accessToken.length).toBeGreaterThan(0);

    expect(body.data.user).toMatchObject({
      id: expect.any(Number),
      email: TEST_USER.email,
      name: expect.any(String),
      role: "user",
      familyId: expect.any(String),
      isVerified: true,
    });
  });
});
