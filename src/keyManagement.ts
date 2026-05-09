import configData from "../config.json";
import type { Config } from "./types";
const config = configData as Config;

export let API_KEY = config.bearerToken;
export let API_REFRESH_TOKEN = config.refreshToken;

export async function refreshTokens() {
	console.log("Refreshing API key");
	const data = await (
		await fetch("https://api.aftergame.co/graphql", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				query: `mutation($refreshToken: String!) { refreshTokens(refreshToken: $refreshToken) { accessToken refreshToken } }`,
				variables: {
					refreshToken: API_REFRESH_TOKEN,
				},
			}),
		})
	).json();

	if (data.errors) {
		console.error("Error refreshing API key:");
		console.error(data.errors);
		return;
	}

	API_KEY = data.data.refreshTokens.accessToken;
	API_REFRESH_TOKEN = data.data.refreshTokens.refreshToken;
	console.log("API key refreshed.");
	console.log(`API key: ${API_KEY}`);
	console.log(`API refresh token: ${API_REFRESH_TOKEN}`);

	await updateConfig(API_KEY, API_REFRESH_TOKEN);
}

/**
 * Updates the config file with the new API key and refresh token.
 * @param newAPIKey The new API key.
 * @param newRefreshToken The new refresh token.
 */
export async function updateConfig(newAPIKey: string, newRefreshToken: string) {
	// Make a mutable copy of the config var
	let data = { ...config };
	// Update the config with the new values
	data.bearerToken = newAPIKey;
	data.refreshToken = newRefreshToken;
	// Write the updated config to the file
	await Bun.write("config.json", JSON.stringify(data, null, 2));
}
