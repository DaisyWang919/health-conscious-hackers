# Health Conscious Hackers

> Simplifying healthcare communication through voice memos and AI-generated health reports.

## Overview

Health Conscious Hackers is an application designed to address the challenges of fragmented healthcare communication. It allows users to record health-related voice memos, automatically transcribes them, and generates comprehensive health reports tailored for different audiences (personal use, doctors, or therapists).

[Try it Out!](https://neon-wisp-3e363a.netlify.app/)

## Features

- **Voice Memo Recording**: Easily record, transcribe, and store health observations
- **AI-Powered Report Generation**: Create organized reports for different audiences:
  - Personal health tracking
  - Doctor visits
  - Therapy sessions
- **Customizable Content**: Edit transcripts and reports to fit your needs
- **Suggested Prompts**: Get inspiration for what health information to record
- **Historical Tracking**: Review past memos and reports
- **Privacy-First**: All data stored locally in your browser

## Technology Stack

- React with TypeScript
- Vite for fast development and optimized builds
- OpenAI API for transcription and report generation
- IndexedDB for local data storage
- TailwindCSS for styling
- React Router for navigation

## Getting Started

### Prerequisites

- Node.js (v16 or newer)
- npm or pnpm package manager
- OpenAI API key (for transcription and report generation features)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/health-conscious-hackers.git

# Navigate to project directory
cd health-conscious-hackers

# Install dependencies
npm install
# or
pnpm install

# Create a .env.local file with your OpenAI API key
echo "VITE_OPENAI_API_KEY=your-openai-api-key-here" > .env.local

# Start the development server
npm run dev
# or
pnpm dev
```

The application will be available at `http://localhost:5173`

## Usage

1. **Record a Health Memo**: Navigate to the Record Memo page and click the microphone icon. Speak about your symptoms, medication effects, or any other health information you want to track.

2. **Review Your Memos**: Visit the Memos page to see all your saved voice memos and transcripts.

3. **Generate Reports**: Select memos to include in a report, choose your target audience (yourself, your doctor, or therapist), and generate an AI-powered health report that organizes your information into a structured format.

4. **Save and Share**: Download reports as markdown files to share with healthcare providers or keep for your personal records.

## Project Structure

- `/src/components`: UI components
- `/src/hooks`: Custom React hooks for state management
- `/src/pages`: Main application pages
- `/src/services`: Service layer for audio handling
- `/src/utils`: Utility functions including database operations
- `/src/styles`: Global styling

## Contributing

We welcome contributions from developers at all skill levels! If you'd like to contribute:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Please make sure to update tests as appropriate and follow the project's code style.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Developed during a health tech hackathon
- Inspired by the challenges patients face in communicating health concerns effectively
- Built with a focus on privacy and user control of sensitive health data
