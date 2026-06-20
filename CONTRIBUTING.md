# Contributing to Vault Secure

First off, thank you for considering contributing to Vault Secure! 🎉

## How Can I Contribute?

### 🐛 Reporting Bugs
- Check if the bug has already been reported in [Issues](https://github.com/rayane88/vault-secure/issues).
- If not, open a new issue using the **Bug Report** template.
- Include as much detail as possible: steps to reproduce, expected vs actual behavior, and screenshots.

### 💡 Suggesting Features
- Open a **Feature Request** issue describing what you'd like to see and why.
- Discuss the idea with the community before starting implementation.

### 🔧 Pull Requests
1. Fork the repository.
2. Create a new branch: `git checkout -b feature/your-feature-name`.
3. Make your changes.
4. Ensure the build passes: `npm run build`.
5. Commit with clear messages following [Conventional Commits](https://www.conventionalcommits.org/).
6. Push and open a Pull Request.

## Development Setup

```bash
git clone https://github.com/rayane88/vault-secure.git
cd vault-secure
npm install
npm run dev          # Development server
npm run build        # Production build
npm run electron:dev # Electron app in dev mode
```

## Code Style
- Use TypeScript strictly.
- Follow the existing code patterns.
- Run `npm run lint` before committing.
- Keep components small and focused.

## Security
- Never commit passwords, API keys, or secrets.
- If you find a security vulnerability, please email the maintainer directly instead of opening a public issue.

## License
By contributing, you agree that your contributions will be licensed under the MIT License.
