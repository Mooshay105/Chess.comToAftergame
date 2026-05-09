export type Game = {
	url: string;
	pgn: string;
	time_control: string;
	end_time: number;
	rated: boolean;
	accuracies: {
		white: number;
		black: number;
	};
	tcn: string;
	uuid: string;
	initial_setup: string;
	fen: string;
	time_class: string;
	rules: string;
	white: {
		"rating": number;
		"result": string;
		"@id": string;
		"username": string;
		"uuid": string;
	};
	black: {
		"rating": number;
		"result": string;
		"@id": string;
		"username": string;
		"uuid": string;
	};
	eco: string;
};

export type Config = {
	apiUrl: string;
	bearerToken: string;
	refreshToken: string;
	uploadDay: number;
	userData: {
		[username: string]: UserData;
	};
	GUEST_USER_ID: string;
	definitions: {
		GAME_DEFINITION_ID: string;
		CHESS_GAME_ID: string;
		COLOUR_PROPERTY_ID: string;
		WHITE_VALUE_ID: string;
		BLACK_VALUE_ID: string;
	};
};

export type UserData = {
	username: string;
	usernameLower: string;
	id: string;
	shouldScrapeGames: boolean;
};

export type RefreshTokenResponse = {
	errors?: [
		{
			message: string;
			locations: [[any, any]];
			path: [string];
			extensions: [Object];
		},
	];
	data: {
		refreshTokens: {
			accessToken: string;
			refreshToken: string;
		};
	};
};
