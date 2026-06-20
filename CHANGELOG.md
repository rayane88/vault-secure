# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-06-20

### Added
- 🎉 Initial release of Vault Secure
- 🔐 AES-256-GCM encryption engine with PBKDF2 key derivation (100,000 iterations)
- 🔑 Password storage with advanced generator (length, character types, strength meter)
- ₿ Crypto wallet storage (addresses, private keys, seed phrases)
- 💳 Bank card storage (number, expiry, CVV)
- 📝 Secure notes
- 🖼️ Photo and file storage with preview
- 🌓 Light / dark theme toggle
- 📤 Export / Import JSON backups (optionally encrypted)
- 📲 Offline mode with Service Worker
- 🖥️ Electron desktop app for Windows (MSI installer)
- 📝 Full GitHub templates (Issues, PRs, Funding)

### Security
- All data encrypted locally with unique salt and IV per item
- No data ever leaves the user's machine
- SHA-256 hashed master password verification

[1.0.0]: https://github.com/rayane88/vault-secure/releases/tag/v1.0.0
