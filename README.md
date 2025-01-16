# Node.js Web Interface for the OpenAI Batch API

A single page web-based to handle Batches from openAI

## Demo

Available demo on codesandbox: https://codesandbox.io/p/devbox/5ks2lg

## Screenshot

![alt text](https://github.com/charlyie/openai-batchapi-ui/blob/main/screenshot.jpg?raw=true)


## Features

- **list**: list of all the current batches
- **input/output**: view JSON (with colored syntax) of the input and output files
- **cancel a batch**: cancel a started batch
- **restrict** : restriction to the most recents batches
- **auto refresh**: refresh automatically every 10s

## Requirements

- **OpenAI API Key**: An API key with access to the GPT models.
- **Node 18+**: for node.js web server (express)

## Getting Started

1. **Clone or Download the Repository**

   Clone the repository 

2. **Get dependencies**

   Be sure you've got node 18+, and type `npm i`

3. **Run server**

   type in your console `node server.js`
  
4. **Launch interface**

   - Go the your web browser to http://localhost:3000 and type your Open AI API Key to retrieve the batches


## Notes

- Ensure your OpenAI API key has access to the GPT models.
- The app uses the OpenAI Chat Completion API endpoint.
- All data, including the API key (if saved) and translation history, is stored locally in your browser.
- No data is transmitted to any server other than OpenAI's API for translation requests.

## Dependencies

- **Tailwind CSS**: Included via CDN for styling.
- **Google Fonts**: Uses "Roboto Serif" for the page title font.
- **highlight.js**: for json syntax

## Releases

- **1.0** (jan '25): initial release

## License

This project is open-source and available under the MIT License.
