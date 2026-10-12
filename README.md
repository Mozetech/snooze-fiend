# Snooze Fiend

An alarm clock you have to fight. When an alarm rings, a pixel-art battle window takes over the screen and a siren loops. The only way to silence it is to defeat the Snooze Fiend in a timing mini game, modeled on the VPetlings desktop pet combat test (x.com/SargantanaGames/status/2087583747105304896).

## How it plays

- Set alarms with the "+ new alarm" button. Times are 12-hour with an AM/PM toggle. Tap an alarm's time to edit it. Alarms persist in localStorage. There is no snooze button.
- The pixel time picker has hour/minute steppers with hold-to-spin, a live "rings in Xh Ym" readout, the label field, and sleep-cycle suggestion chips computed from the current time (15 min to drift off, then 3 to 6 whole 90-minute cycles).

## Progression

- Winning a fight shows a claim screen ("I'M UP!" for alarms, so silencing means proving you're awake). Claiming grants XP and coins; crits and perfect parries add bonuses, and a knockout-free alarm fight adds a flawless bonus.
- Levels cost more XP as you climb (level n to n+1 costs n*100).
- Kiko's Closet sells cosmetics with earned coins: hats and scarves that Kiko visibly wears on the clock screen, in battle, and in the HP bar mini icon. Purchases and outfits persist.
- When an alarm fires, the battle starts and the siren will not stop until the Fiend's HP hits zero.
- Every round rolls a random mini game, so each knockout "snooze" cycles you into a different fight.

Attack mini games (one is rolled each turn):

- Sweep meter: a cursor sweeps across a multiplier bar (x0.5, x1, x3, x1, x0.5). Click or press space to lock your damage. Center zone is a crit.
- Mash: hammer clicks or space inside the window; every hit powers the attack.
- Combo: repeat a five-arrow pattern using left/right clicks (screen halves) or arrow keys. A wrong input resets the chain.

Defend mini games:

- Parry: two arrows slide toward a center diamond. Click the instant they converge for a perfect parry (no damage plus a counterattack). Late is a half block, very late is a full hit.
- Closing ring: a diamond outline shrinks onto the target. Click the moment it lands, same timing windows as the parry.

If you get knocked out, the Fiend heals to full, the siren gets faster and louder, and the fight restarts with a fresh roll of mini games. Winning is the only exit.

## Pomodoro mode

The Pomodoro card runs focus/break cycles (durations configurable, saved to localStorage). When a segment's timer hits zero the Fiend appears, exactly like an alarm; beating it flips you into the next segment automatically. Pausing and resetting work while a timer runs, and if the timer expires mid-battle it politely waits for the current fight to finish.

## Run it

Any static server works:

```bash
python3 -m http.server 4400 -d alarm-battle
```

Then open http://localhost:4400. Keep the tab open (and interact with the page once) so the alarm can ring; browsers block audio until the page has had one user gesture.

## Stack

Vanilla HTML/CSS/JS, no build step. Sprites are pixel maps drawn to canvas, all audio is synthesized with the Web Audio API, no assets. Fonts (Pixelify Sans, VT323) are vendored in `fonts/` so the app works offline.

## Android

A native Android version lives in `../alarm-battle-android`: the same game in a WebView, with real `AlarmManager` scheduling, a lock-screen battle activity, and a native siren on the alarm audio stream. `game.js` detects the `AndroidBridge` JS interface and defers alarm firing and siren duties to the native side; the same files run unchanged on the web.
