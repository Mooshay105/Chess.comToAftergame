import { refreshTokens } from "./keyManagement";
import { uploadGames } from "./gameUploader";

async function main() {
	// Token Refresh Scheduler
	console.log("[INFO]: Starting Token Refresh Scheduler");
	setInterval(refreshTokens, 6 * 60 * 60 * 1000);
	console.log("[INFO]: Token Refresh Scheduler Started.");
	console.log("[INFO]: Starting Initial refresh.");
	await refreshTokens();
	console.log("[INFO]: Initial refresh complete.");
	// Game Upload Scheduler
	console.log("[INFO]: Starting Game Uploader Scheduler");
	setInterval(uploadGames, 60 * 60 * 1000);
	console.log("[INFO]: Game Uploader Scheduler Started.");
	console.log("[INFO]: Starting Initial Game Upload.");
	await uploadGames();
	console.log("[INFO]: Initial Game Upload Complete.");

	console.log("[INFO]: All tasks started.");
}

main();
