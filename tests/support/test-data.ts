import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

export const TEST_USER = {
  email: process.env.TEST_USERNAME || "mmhmasum98@gmail.com",
  password: process.env.TEST_PASSWORD || "123456",
};

export const NAVIGATION = {
  dashboard: "Dashboard",
  userManagement: "User Management",
  parentalControls: "Parental Controls",
  subscription: "Subscription",
  pushNotifications: "Push Notifications",
};
