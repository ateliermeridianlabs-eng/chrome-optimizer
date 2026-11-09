-- "Photo Booth Blocker" app: turns the blocker on or off.
-- install.command builds it into /Applications. Off = the file below exists.
set flag to "/Library/MinecraftBlocker/off"
set isOff to (do shell script "[ -e " & flag & " ] && echo off || echo on") is "off"
if isOff then
	set btn to "Turn ON"
	set msg to "The Photo Booth blocker is OFF."
else
	set btn to "Turn OFF"
	set msg to "The Photo Booth blocker is ON."
end if
display dialog msg buttons {"Cancel", btn} default button btn with title "Photo Booth Blocker"
if isOff then
	do shell script "rm -f " & flag with administrator privileges
	display notification "Photo Booth is blocked again." with title "Photo Booth Blocker"
else
	do shell script "touch " & flag with administrator privileges
	display notification "Photo Booth is allowed." with title "Photo Booth Blocker"
end if
