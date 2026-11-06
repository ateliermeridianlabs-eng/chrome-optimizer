// Google Optimizer: the only settings. Everything else (Instagram lock, Shorts, Facebook/Threads,
// YouTube focus mode) is always on and lives in blocker.js. Change defaults here; the popup edits these.
var GO_DEFAULTS = {
  // When Claude finishes a reply on claude.ai: "alert" (window you must click), "switch" (jump to the tab), "off"
  claudeMode: "alert",
  // YouTube focus mode: only these channels play (one per line: @handle, name, or UC... id)
  ytAllowChannels: "@veritasium\n@3blue1brown\n@TwoMinutePapers\n@aiexplained-official",
  // ...or any video whose title contains one of these words
  ytAllowKeywords: "",
  // Your YouTube home page shows the newest videos from these channels (they are also allowed)
  ytEduChannels: "@3blue1brown\n@TheOrganicChemistryTutor\n@veritasium\n@kurzgesagt\n@minutephysics\n@numberphile\n@CrashCourse\n@khanacademy\n@smartereveryday\n@TwoMinutePapers",
  // Subscriptions cleanup on youtube.com/feed/channels keeps only these
  ytKeepSubs: "@veritasium\n@kurzgesagt\n@FlameFragsMC\n@wemmbumc\n@Spokeishere\n@ParrotX2"
};
