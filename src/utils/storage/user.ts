import { Store } from "tauri-plugin-store-api";

export interface UserStore {
	user: {
		Name: string;
		AccessToken: string;
	};
}

const user = new Store(".user.dat");

/**
 * Set User details to .user.dat
 */
const saveUser = async (userName: string, accessToken: string) => {
	user.set("user", {
		Name: userName,
		AccessToken: accessToken,
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
	sessionStorage.removeItem("accessToken");
	await user.clear();
	await user.save();
};

export { saveUser, getUser, delUser };
