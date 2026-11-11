-- Quit and relaunch Übersicht, then wait for its widget server to answer.
-- Shell only (no "tell application"), so macOS never asks for automation permission.
-- The [b] in the pattern keeps pkill from matching its own command line.
-- Build the clickable app with:  osacompile -o ~/Applications/"Restart Board.app" restart.applescript
do shell script "pkill -f '[b]ersicht.app/Contents' ; sleep 1 ; pkill -9 -f '[b]ersicht.app/Contents' ; sleep 1 ; open -b tracesOf.Uebersicht"
set isUp to false
repeat 30 times
	delay 1
	set code to do shell script "curl -s -o /dev/null -w '%{http_code}' --max-time 2 http://127.0.0.1:41416/build-board/index.jsx || true"
	if code is "200" then
		set isUp to true
		exit repeat
	end if
end repeat
if isUp then
	display notification "Übersicht is back up" with title "Build Board"
else
	display notification "Übersicht relaunched but the board isn't answering yet" with title "Build Board"
end if
