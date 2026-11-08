# Aurelian AI

**A web-enabled conversational research assistant built with Next.js and TypeScript.**

Aurelian AI is a web application designed to help users explore questions through a conversational interface, combining web search with AI-assisted research.

🌐 **[Live Application](https://aurelian-ai.vercel.app)**

## Overview

Aurelian AI explores how conversational interfaces can make online research more accessible and intuitive.

The project focuses on combining web information retrieval, a responsive user interface, and conversational workflows into a unified application.

## Key Features

- **Conversational Interface:** Ask questions through a chat-based user experience.
- **Web Search Integration:** Integrates Tavily to support web-informed research.
- **Research Workflow:** Designed around searching, ranking, and synthesizing relevant information.
- **Follow-up Questions:** Supports conversational exploration of related topics.
- **Conversation History:** Provides a sidebar interface for navigating conversations.
- **Responsive Design:** Uses modern frontend technologies to create an accessible interface.

## Technology Stack

| Category | Technologies |
|---|---|
| Framework | Next.js, React |
| Language | TypeScript |
| Styling | Tailwind CSS |
| UI Components | Radix UI, shadcn |
| Web Search | Tavily API |
| Deployment | Vercel |
| Version Control | Git, GitHub |

## Architecture

The application is organized around three main responsibilities:

1. **User Interaction:** The Next.js frontend provides the conversational interface and displays research results.
2. **Information Retrieval:** The application integrates a web-search service to retrieve information relevant to user queries.
3. **Response Presentation:** Research results are presented through a conversational workflow designed to support follow-up exploration.

## Engineering Focus

This project provided an opportunity to explore:

- Full-stack application development using Next.js and TypeScript
- Integration of external web-search APIs
- Asynchronous research workflows
- Conversational interface design
- Frontend state management and user experience
- Cloud deployment and application iteration

## Running Locally

Clone the repository:

```bash
git clone https://github.com/neevvarma/aurelian-ai.git
cd aurelian-ai
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Open `http://localhost:3000` in your browser.

**Note:** Features requiring external services may need API credentials configured through environment variables. Refer to the application's integration code for the required configuration.

## Future Development

Potential improvements include:

- Improving response quality and relevance
- Expanding source transparency
- Enhancing conversational context management
- Improving research workflow performance
- Adding testing and evaluation for research results

## Author

**Neev Varma**

Software Developer | Graduate Student, Boston University

[GitHub](https://github.com/neevvarma)
