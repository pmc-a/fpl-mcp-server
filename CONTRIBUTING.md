# Contributing to FPL MCP Server

Thank you for your interest in contributing! This document provides guidelines for contributing to this project.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check existing issues to avoid duplicates. When creating a bug report, include:

- A clear and descriptive title
- Steps to reproduce the issue
- Expected behavior vs actual behavior
- Your environment (Node.js version, OS, etc.)
- Any relevant logs or error messages

### Suggesting Enhancements

Enhancement suggestions are welcome! Please provide:

- A clear and descriptive title
- Detailed description of the proposed feature
- Use cases and examples
- Why this enhancement would be useful

### Pull Requests

1. Fork the repository
2. Create a new branch (`git checkout -b feature/your-feature-name`)
3. Make your changes
4. Ensure your code follows the existing style
5. Test your changes thoroughly
6. Commit your changes with clear, descriptive messages
7. Push to your fork
8. Open a Pull Request

#### Pull Request Guidelines

- Keep PRs focused on a single feature or fix
- Update documentation if needed
- Add or update tests if applicable
- Ensure all tests pass
- Follow the existing code style
- Write clear commit messages

## Development Setup

1. Clone the repository:
```bash
git clone https://github.com/pmc-a/fpl-mcp-server.git
cd fpl-mcp-server
```

2. Install dependencies:
```bash
npm install
```

3. Build the project:
```bash
npm run build
```

4. Run in development mode:
```bash
npm run dev
```

## Testing

Test your changes using the MCP Inspector:

```bash
npm run build
npx @modelcontextprotocol/inspector --config ./mcp.config.json --server fpl-mcp-server
```

## Code Style

- Use TypeScript for all code
- Follow existing formatting conventions
- Use meaningful variable and function names
- Add comments for complex logic
- Keep functions focused and concise

## Commit Messages

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification for all commit messages. This leads to more readable messages and helps with automated changelog generation.

**Note:** Commit messages are automatically validated in pull requests using commitlint to ensure they follow the conventional commits standard.

### Format

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Types

- `feat:` - A new feature
- `fix:` - A bug fix
- `docs:` - Documentation only changes
- `style:` - Changes that don't affect code meaning (formatting, whitespace, etc.)
- `refactor:` - Code change that neither fixes a bug nor adds a feature
- `perf:` - Performance improvements
- `test:` - Adding or updating tests
- `chore:` - Changes to build process or auxiliary tools
- `ci:` - Changes to CI configuration files and scripts

### Examples

```bash
feat: add player injury status to player stats
fix: handle null values in team squad data
docs: update installation instructions
refactor: simplify error handling logic
perf: optimize player search algorithm
```

### Breaking Changes

For breaking changes, add `!` after the type or include `BREAKING CHANGE:` in the footer:

```bash
feat!: change player comparison output format

BREAKING CHANGE: compare_players now returns data in a different structure
```

### Guidelines

- Keep the subject line under 72 characters
- Use imperative mood ("add" not "added" or "adds")
- Don't capitalize the first letter of the description
- Don't end the subject line with a period
- Reference issues and PRs in the footer when relevant (e.g., `Closes #123`)

## Questions?

Feel free to open an issue for any questions about contributing.

Thank you for contributing! 🎉
