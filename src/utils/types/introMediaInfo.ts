type introSkipperResult = {
	EpisodeId: string;
	Valid: true;
	IntroStart: number;
	IntroEnd: number;
	ShowSkipPromptAt: number;
	HideSkipPromptAt: number;
};

type IntroMediaInfo = {
	Introduction: introSkipperResult;
	Credits: introSkipperResult;
};

export default IntroMediaInfo