# atc-trello

Listens for changes on the Air Traffic Control Trello board and uses those events to sync to the BPA Trello board.

Cards that are moved into the "In Flight" status are examined.  If a card's description includes one or more BPA orders (of the form: `BPA: <order name>`), a card will be created in the BPA Trello for each BPA order, with a link back to the ATC card.  The ATC card will then be updated to include links to all applicable BPA orders.

**Planned:**  The server will also listen to the BPA Trello board and will update the labels on ATC cards as BPA order moves through the system.

## Running

Clone this repo, then run `npm install`.  Once all the dependencies are down, you can start the server with `npm start`

### Environment

The following environment variables are used:

name                 | description
-------------------- | ----------------------------------------------------------------------------------------------------------------------------------------
TRELLO_API_KEY       | Obtained from [Trello](https://trello.com/app-key). Located near the top of that page.
TRELLO_CLIENT_SECRET | Obtained from [Trello](https://trello.com/app-key). There's a link to generate the key at the end of the first paragraph headed "Token."
TRELLO_API_TOK       | Obtained from [Trello](https://trello.com/app-key). Located near the bottom of that page.
ATC_TRELLO_BOARD_ID  | The board ID of the Air Traffic Control board.
BPA_TRELLO_BOARD_ID  | The board ID of the BPA board.
LOCALTUNNEL          | Optional.  If `true`, creates a localtunnel.me for the local server.
PORT                 | Optional.  If not set, defaults to 5000.

### Public domain

This project is in the worldwide [public domain](LICENSE.md). As stated in [CONTRIBUTING](CONTRIBUTING.md):

> This project is in the public domain within the United States, and copyright and related rights in the work worldwide are waived through the [CC0 1.0 Universal public domain dedication](https://creativecommons.org/publicdomain/zero/1.0/).

> All contributions to this project will be released under the CC0 dedication. By submitting a pull request, you are agreeing to comply with this waiver of copyright interest.
