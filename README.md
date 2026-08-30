# ArgasX API Tester

A powerful, local-first, privacy-focused REST API testing desktop client built with React, TypeScript, Tailwind CSS, and Tauri v2.

![ArgasX API Tester](src-tauri/icons/icon.png)

## Key Features

- ⚡ **Local-First & Offline**: All requests, history, collections, and environments are stored locally in your browser/app local storage. No cloud server required.
- 🎨 **Minimal & Modern Dark UI**: Glassmorphism aesthetic inspired by Postman with a deep black and grey theme.
- 🚀 **Multi-Format Support**: Test GET, POST, PUT, DELETE, PATCH, HEAD, and OPTIONS requests with JSON, XML, HTML, and Form-Data payloads.
- 📁 **Collections & Import/Export**: Organize requests into collections. Fully compatible with Postman Collection v2.1 JSON import and export.
- 🌐 **Environments & Variables**: Manage environment variables with dynamic `{{variable}}` substitution in URLs, headers, and body payloads.
- 🧪 **Pre-Request & Test Scripting**: Write sandbox JavaScript pre-request scripts and test assertions with the `pm.*` API (`pm.test`, `pm.expect`, `pm.environment.set`).
- 🏃 **Collection Runner**: Run entire collections sequentially with custom delay controls, CSV/JSON data-driven iterations, and live execution reporting.
- 🎯 **Wrap Text & Formatting**: Toggle line wrapping for long JSON/HTML responses and auto-pretty-format response payloads.

## Downloads & Releases

Download the latest standalone executable or installer packages from the [Releases](https://github.com/altamashs993/ArgasX-API-Tester/releases) page:

- **Standalone Windows Executable**: `argasx-api-tester.exe`
- **Windows Setup Installer (NSIS)**: `ArgasX API Tester_1.0.0_x64-setup.exe`
- **Windows MSI Installer**: `ArgasX API Tester_1.0.0_x64_en-US.msi`

## Building from Source

### Prerequisites

- Node.js (v18+)
- Rust (latest stable toolchain)

### Setup & Build

```bash
# Clone the repository
git clone https.github.com/altamashs993/ArgasX-API-Tester.git
cd "ArgasX API Tester"

# Install dependencies
npm install

# Run in development mode
npm run dev

# Build Windows desktop release binary
npx tauri build
```

## Automated Testing

Run the automated module test suite:

```bash
npx tsx scripts/test-all-modules.ts
```

## License

MIT License.
