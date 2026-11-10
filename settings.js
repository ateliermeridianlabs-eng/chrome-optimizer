// Google Optimizer: the only settings. Everything else (Instagram lock, Shorts, Facebook/Threads,
// YouTube focus mode) is always on and lives in blocker.js. Change defaults here; the popup edits these.
var GO_DEFAULTS = {
  // When Claude finishes a reply on claude.ai: "alert" (window you must click), "switch" (jump to the tab), "off"
  claudeMode: "alert",
  // YouTube focus mode: only these channels play (one per line: @handle, name, or UC... id).
  // Add ": word word" after a channel to allow only its videos whose title has one of those words.
  ytAllowChannels: "@ProfessorLeonard\n@TheOrganicChemistryTutor",
  // ...or any video whose title contains one of these words
  ytAllowKeywords: "",
  // Your YouTube home page shows the newest videos from these channels (they are also allowed)
  ytEduChannels: "@numberphile\n@TheOrganicChemistryTutor: physics calculus derivative integral integration limits\n@TEDEd: riddle philosoph\n@mitocw\n@Baablu\n@ogmoe\n@Dewier",
  // Subscriptions cleanup on youtube.com/feed/channels keeps only these
  ytKeepSubs: "@veritasium\n@kurzgesagt\n@FlameFragsMC\n@wemmbumc\n@Spokeishere\n@ParrotX2"
};

// Gmail: mail from these goes in the "Important" section at the top of the inbox (gmail.js).
// One per line: full address, a domain (anyone @that domain), or a word found in the sender's address or name.
GO_DEFAULTS.gmailImportant = "hssandy168@gmail.com\nhssandy168@126.com\nsuwj168@126.com\nstarkmh002@gmail.com\nbounce.torontopubliclibrary.ca\nbrightspace\nd2l";
