# Next.js App with OpenAI Realtime API Conversation

This is a sample Next.js project with an OpenAI Realtime API Conversation integration using a relay server. It's a copy of the [React Realtime Console](https://github.com/openai/openai-realtime-console) offered by OpenAI, simplified and all of the functions removed. This can give you a starting point for integrating the API in your Next.js web app.

Right now, the project simply consists of a button that starts the conversation upon clicking. Make sure to have a microphone connected to your system for the conversation flow to work.

## Installation
Clone the repo and install dependencies:
```
git clone https://github.com/takavor/nextjs-openairealtime.git
cd nextjs-openairealtime
npm i
cp .env.example .env
```
Fill out the `.env` by setting your OpenAI secret key and a URL for the relay server (you can set it to be `http://localhost:8081` by default).

Then, start the relay server by running `npm run relay`, and start the development server in parallel by running `npm run dev`.

## Contribution
Contributions are welcome. Please open an issue if you find any problems.
