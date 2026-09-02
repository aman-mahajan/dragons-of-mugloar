# Dragons of Mugloar

Bot for the Dragons of Mugloar API. Plays until lives run out.

## Run

To run the project, you need to run these two commands:

    npm install
    npm start
    npm start -- --games=N  => when you want to run multiple games back to back

## How ads are picked

Each turn the bot takes the safest ad on the board (easiest probability label, then higher reward). Steal and kill jobs are skipped when people, state, or underworld is already at -2 or worse. Every 3 turns it spends one turn checking live reputation so the values stay accurate.

## Shopping logic

After every turn, try to shop an item. We consider having 5 lives as sufficient. Choose healing potion if lives < 5. If lives are sufficient, chose the best available item that can be bought with the gold available. We shuffle the list of items in the shop so that different items are picked. This helps increase the players level while also allowing enough lives to handle lost ads.


## Handling encrypted Ads

- Encrypted ads are decoded using the encrypted field of the Ad. After examining the responses, two types of encryption were found. Encrypted value 1 corresponds to Base64 encoding and encrypted value 2 corresponds to rot13 encoding. The encoding was found by matching probability string with known probability strings after trying to decode using different encoding methods.
- Other future encryption types if encountered are skipped currently. 