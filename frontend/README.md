# Dragons of Mugloar

Web app to play the Dragons of Mugloar game (https://www.dragonsofmugloar.com) developed using React.js and powered by Vite. Start a game, pick ads to solve, and buy shop items.

## Setup

    npm install
    npm run dev

Open the URL as mentioned in the terminal (http://localhost:5173 by default).

## Features

- Player can switch on recommendations that would suggest the best ad to pick given the current state of the game and the player's reputation among the different factions. The suggested ad is pinned on top the ad list and marked with `Suggested` tag. Turning on recommendations will auto fetch player reputation every 3 turns and costs one turn.
- Player can load current active game even if the browser or tab was closed. The state of the game and player's recommendation setting is saved in the local storage.
- Player can buy different shop items from the shop if enough gold is available. The buttons are disabled if there is not enough gold.
- Player can view the current game stats and the reputation. The player can also update and check their reputation themselves.
- Every Ad contains reward/risk ratio to help the player decide which ad to pick.
- Extra risky ads that hurt the reputation of the player are also tagged with `extra risk` labels.

## Suggestions

When recommendations are on, the suggested ad is the safest one on the board (easiest probability, then higher reward). Steal and kill jobs are skipped if people, state, or underworld is already at -2 or worse. Reputations go stale, so the client auto-checks reputation every 3 turns (that check costs a turn).

## Handling encrypted Ads

- Encrypted ads are decoded using the encrypted field of the Ad. After examining the responses, two types of encryption were found. Encrypted value 1 corresponds to Base64 encoding and encrypted value 2 corresponds to rot13 encoding. The encoding was found by matching probability string with known probability strings after trying to decode using different encoding methods.
- Other future encryption types if encountered are skipped currently. 

