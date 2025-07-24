# Results America Project

This directory contains the Results America application in the `results-america-app` subdirectory.

## 🚀 Quick Start

Use the `dev.sh` script to run commands from this directory:

```bash
# Start development server (default)
./dev.sh

# Or explicitly
./dev.sh dev

# Other commands
./dev.sh build        # Build for production
./dev.sh test         # Run tests
./dev.sh lint         # Run ESLint
./dev.sh validate     # Run validation
./dev.sh db:studio    # Open database studio
./dev.sh help         # Show all commands
```

## 📁 Project Structure

```
results_america_cursor/
├── results-america-app/     # Main Next.js application
│   ├── src/
│   ├── package.json
│   └── ...
├── dev.sh                   # Development command launcher
└── README.md               # This file
```

## 🌐 Development Server

Once started, the development server will be available at:
- **Local**: http://localhost:3050
- **Network**: http://your-ip:3050

## 📝 Notes

- The `dev.sh` script automatically navigates to the correct directory
- All git operations should be done from within `results-america-app/`
- The development server runs on port 3050 (not the default 3000) 