import type { Config, Game, UserData } from "./types";
import configData from "../config.json";
import { API_KEY } from "./keyManagement";
const config = configData as Config;

const MUTATION = `mutation createPlayLog($input: CreatePlayLogInput!) {
  createPlayLog(input: $input) {
    playLog { id playedAt }
  }
}`;

const WIN_RESULTS = new Set(["win"]);
const DRAW_RESULTS = new Set([
	"agreed",
	"repetition",
	"stalemate",
	"insufficient",
	"50move",
	"timevsinsufficient",
]);

function chessComResult(result: string): number | null {
	if (WIN_RESULTS.has(result)) return 1;
	if (DRAW_RESULTS.has(result)) return null;
	return 0;
}

function getOpponentUserId(opponentUsername: string): string {
	const lower = opponentUsername.toLowerCase();
	if (lower in config.userData) {
		return config.userData[lower as keyof typeof config.userData].id;
	}

	return config.GUEST_USER_ID;
}

async function getGames(username: string, YYYY: number, mm: number): Promise<Game[]> {
	const response = await fetch(
		`https://api.chess.com/pub/player/${username}/games/${YYYY}/${String(mm).padStart(2, "0")}`,
	).then((r) => r.json() as Promise<{ games: Game[] }>);
	return response.games;
}

async function postGame(game: Game, userData: UserData): Promise<void> {
	const iAmWhite = game.white.username.toLowerCase() === userData.usernameLower;

	if (
		game.white.username.toLowerCase() !== userData.usernameLower &&
		game.black.username.toLowerCase() !== userData.usernameLower
	) {
		console.warn(
			`Skipping game — neither player is me: ${game.white.username} vs ${game.black.username}`,
		);
		return;
	}

	const myPlayer = iAmWhite ? game.white : game.black;
	const opponentPlayer = iAmWhite ? game.black : game.white;

	const me = {
		id: userData.id,
		inputRole: {
			selection: [
				{
					id: config.definitions.COLOUR_PROPERTY_ID,
					label: "Colour",
					value: iAmWhite ? "White" : "Black",
					valueId: iAmWhite
						? config.definitions.WHITE_VALUE_ID
						: config.definitions.BLACK_VALUE_ID,
				},
			],
		},
		inputScore2: null,
		outputRole: iAmWhite ? "White" : "Black",
		outputScore: null,
		result: chessComResult(myPlayer.result),
		type: "PLAYER",
	};

	const opponent = {
		id: getOpponentUserId(opponentPlayer.username),
		inputRole: {
			selection: [
				{
					id: config.definitions.COLOUR_PROPERTY_ID,
					label: "Colour",
					value: iAmWhite ? "Black" : "White",
					valueId: iAmWhite
						? config.definitions.BLACK_VALUE_ID
						: config.definitions.WHITE_VALUE_ID,
				},
			],
		},
		inputScore2: null,
		outputRole: iAmWhite ? "Black" : "White",
		outputScore: null,
		result: chessComResult(opponentPlayer.result),
		type: "PLAYER",
	};

	const res = await fetch(config.apiUrl, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			"authorization": `Bearer ${API_KEY}`,
		},
		body: JSON.stringify({
			operationName: "createPlayLog",
			query: MUTATION,
			variables: {
				input: {
					comment: "On Chess.com: " + game.url,
					gameDefinitionId: config.definitions.GAME_DEFINITION_ID,
					gameIds: [config.definitions.CHESS_GAME_ID],
					inputScenario: null,
					media: [],
					outputScenario: null,
					playedAt: new Date(game.end_time * 1000).toISOString(),
					players: iAmWhite ? [me, opponent] : [opponent, me],
					teams: [],
				},
			},
		}),
	});

	const json = (await res.json()) as { errors?: { message: string }[]; data?: unknown };

	if (json.errors) {
		throw new Error(json.errors.map((e) => e.message).join(", "));
	}
}

let hasRun = false;

export async function uploadGames() {
	const now = new Date();
	if (now.getDate() === config.uploadDay) {
		if (!hasRun) {
			hasRun = true;
			console.log("It's the 3rd! Running task.");
			const month = now.getMonth() === 0 ? 12 : now.getMonth();
			const scrapedUsers: string[] = [];

			const usersToScrape = Object.values(config.userData)
				.filter((user) => user.shouldScrapeGames)
				.map((user) => user.usernameLower);

			for (const user of usersToScrape) {
				console.log(`Scraping games for ${user}`);
				const games = await getGames(
					user,
					now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear(),
					month,
				);
				for (const g of games) {
					const opponent =
						g.white.username.toLowerCase() === user
							? g.black.username.toLowerCase()
							: g.white.username.toLowerCase();

					if (!scrapedUsers.includes(opponent)) {
						await postGame(g, config.userData[user as keyof typeof config.userData]);
					} else {
						console.log(
							`Skipping game — already scraped: ${g.white.username} vs ${g.black.username}`,
						);
					}
				}
				scrapedUsers.push(user);
			}
		} else {
			console.log("Already ran. Skipping.");
		}
	} else {
		hasRun = false;
		console.log("Not the 3rd. Skipping.");
	}
}
