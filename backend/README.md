# Dragons of Mugloar

Bot for the Dragons of Mugloar API. Plays until lives run out.

## Prerequisites

You need to have [Node.js](https://nodejs.org/en/download/) installed. Node includes npm as its default package manager.

## Run

Clone the project and cd into this folder.
Commands to run the application

    npm install
    
    # play one game
    npm start
    # play N games back to back
    npm start -- --games=N

## Test
    npm test

## How ads are picked

Each turn the bot takes the safest ad on the board (easiest probability label, then higher reward). Steal and kill jobs are skipped when people, state, or underworld is already at -2 or worse. Every 3 turns it spends one turn checking live reputation so the values stay accurate.

## Shopping logic

After every turn, try to shop an item. We consider having 5 lives as sufficient. Choose healing potion if lives < 5. If lives are sufficient, chose the best available item that can be bought with the gold available. We shuffle the list of items in the shop so that different items are picked. This helps increase the players level while also allowing enough lives to handle lost ads.


## Handling encrypted Ads

- Encrypted ads are decoded using the encrypted field of the Ad. After examining the responses, two types of encryption were found. Encrypted value 1 corresponds to Base64 encoding and encrypted value 2 corresponds to rot13 encoding. The encoding was found by matching probability string with known probability strings after trying to decode using different encoding methods.
- Other future encryption types if encountered are skipped currently. 