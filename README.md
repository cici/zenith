# Project Zenith

[![CI](https://github.com/cici/zenith/actions/workflows/ci.yml/badge.svg)](https://github.com/cici/zenith/actions/workflows/ci.yml)
[![Deploy](https://github.com/cici/zenith/actions/workflows/deploy.yml/badge.svg)](https://github.com/cici/zenith/actions/workflows/deploy.yml)
[![License](https://img.shields.io/github/license/cici/zenith)](https://github.com/cici/zenith/blob/main/LICENSE)
[![Node.js Version](https://img.shields.io/node/v/vite)](https://nodejs.org)
[![Dependencies Status](https://img.shields.io/librariesio/github/cici/zenith)](https://libraries.io/github/cici/zenith)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg)](https://github.com/prettier/prettier)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.2-blue)](https://www.typescriptlang.org/)
[![Last Commit](https://img.shields.io/github/last-commit/cici/zenith)](https://github.com/cici/zenith/commits/main)

## Project info

**URL**: https://lovable.dev/projects/10e8aa49-2bef-4a95-a489-9849186aceb0

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/10e8aa49-2bef-4a95-a489-9849186aceb0) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## Deployment

This project is deployed on [Railway](https://railway.app), a modern cloud platform that makes deploying applications simple and scalable.

### Manual Deployment

1. Install the Railway CLI:
```bash
npm install -g @railway/cli
```

2. Login to Railway:
```bash
railway login
```

3. Link your project:
```bash
railway link
```

4. Deploy your application:
```bash
railway up
```

### Automatic Deployment

The project is configured with GitHub Actions for continuous deployment. Every push to the `main` branch triggers an automatic deployment to Railway.

Required GitHub Secrets:
- `RAILWAY_TOKEN`: Your Railway API token
- `RAILWAY_SERVICE_ID`: Your Railway service ID

You can find these values in your Railway dashboard under Project Settings.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)
