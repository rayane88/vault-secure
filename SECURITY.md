# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

⚠️ **If you discover a security vulnerability, please do NOT open a public issue.**

Instead, contact the maintainer directly at:
- GitHub: [@rayane88](https://github.com/rayane88)

We take all security reports seriously. You can expect:
- An acknowledgment within **48 hours**.
- A detailed response within **7 days**.
- A fix release as soon as possible, depending on severity.
- Public disclosure only after a fix is available.

## Security Measures

- **AES-256-GCM** encryption for all stored data.
- **PBKDF2** with 100,000 iterations for key derivation.
- **Unique salt and IV** generated cryptographically per item.
- **100% local storage** — nothing is sent to any server.
- **No telemetry** — we do not collect any usage data.

## Responsible Disclosure

We appreciate responsible disclosure and will credit researchers in our release notes (unless they prefer anonymity).
