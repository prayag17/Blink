/** @format */

import { Store } from "tauri-plugin-store-api";

// TODO: Add encryption to user data
export interface UserStore {
  user: {
    Name: string;
    Password: string;
  };
}

const user = new Store(".user.dat");

/**
 * Set User details to .user.dat
 */
const saveUser = async (userName: string, userPassword?: string) => {
  user.set("user", {
    Name: userName,
    Password: userPassword || "",
  });
  await user.save();
};

/**
 * Get saved user fro .user.dat
 * @return {object}
 */
const getUser = async () => {
  return user.get<UserStore["user"]>("user");
};

/**
 * Delete user from storage
 */
const delUser = async () => {
  await user.clear();
  await user.save();
};

export { saveUser, getUser, delUser };
