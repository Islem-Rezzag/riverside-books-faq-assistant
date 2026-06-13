# Riverside Books FAQ Assistant

A command-line FAQ chatbot for the Riverside Books technical task.

## Current Status

Project setup is complete. Chatbot implementation will follow in a later step.

## Install

```bash
npm install
```

## Development

```bash
npm run dev
```

## Build

```bash
npm run build
```

## Tests

```bash
npm test
```

## Optional OpenAI API Key

If OpenAI support is added later, create a local `.env` file and add a real `OPENAI_API_KEY` there. Never commit `.env` or any other file containing secrets.

## Answering Approach

The final assistant will return approved FAQ answers from `faqs.json` rather than generating unsupported answers.
