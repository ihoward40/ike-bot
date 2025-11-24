# Contributing to IKE-BOT

Thank you for your interest in contributing to IKE-BOT! This document provides guidelines and instructions for contributing.

## Getting Started

1. **Fork the repository**
   ```bash
   # Click the "Fork" button on GitHub
   ```

2. **Clone your fork**
   ```bash
   git clone https://github.com/YOUR_USERNAME/ike-bot.git
   cd ike-bot
   ```

3. **Install dependencies**
   ```bash
   npm install
   ```

4. **Set up environment**
   ```bash
   cp .env.example .env
   # Edit .env with your credentials
   ```

5. **Create a branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

## Development Workflow

### Running the Development Server

```bash
npm run dev
```

The server will start with hot reload at `http://localhost:3000`.

### Building the Project

```bash
npm run build
```

### Code Style

- Use TypeScript for all new code
- Follow the existing code structure and patterns
- Use meaningful variable and function names
- Add comments for complex logic
- Keep functions small and focused

### Project Structure

```
src/
├── config/           # Configuration files
├── controllers/      # Request handlers
├── middleware/       # Express middleware
├── routes/           # API routes
├── services/         # Business logic
├── types/            # TypeScript types
└── utils/            # Utility functions
```

## Making Changes

### Adding a New Feature

1. Create a new branch from `main`
2. Implement your feature following the existing patterns
3. Update documentation if needed
4. Test your changes
5. Submit a pull request

### Adding a New Endpoint

1. **Create/update the service** in `src/services/`
2. **Create/update the controller** in `src/controllers/`
3. **Add the route** in `src/routes/`
4. **Update documentation** in `docs/API.md`
5. **Add to API collection** in `docs/API_COLLECTION.json`

Example:
```typescript
// src/services/exampleService.ts
export class ExampleService {
  async doSomething() {
    // Business logic here
  }
}

// src/controllers/exampleController.ts
import { asyncHandler } from '../middleware/errorHandler';

export const doSomething = asyncHandler(async (req, res) => {
  // Handle request
  res.json({ success: true });
});

// src/routes/example.routes.ts
import { Router } from 'express';
import * as exampleController from '../controllers/exampleController';

const router = Router();
router.post('/something', exampleController.doSomething);

export default router;
```

### Fixing a Bug

1. Create an issue describing the bug (if not already exists)
2. Create a branch: `fix/issue-number-description`
3. Write a test that reproduces the bug (if applicable)
4. Fix the bug
5. Verify the test passes
6. Submit a pull request referencing the issue

## Testing

Currently, the project doesn't have automated tests. When adding tests:

1. Create test files alongside the code: `*.test.ts`
2. Use a testing framework like Jest or Mocha
3. Test both success and error cases
4. Mock external dependencies (Supabase, Notion, etc.)

## Pull Request Process

1. **Update documentation** for any user-facing changes
2. **Describe your changes** in the PR description
3. **Reference related issues** using `Fixes #123` or `Relates to #123`
4. **Keep PRs focused** - one feature or fix per PR
5. **Ensure builds pass** - run `npm run build` before submitting

### PR Checklist

- [ ] Code follows the project style
- [ ] Documentation updated
- [ ] Build passes (`npm run build`)
- [ ] Branch is up to date with main
- [ ] PR description is clear and complete

## Commit Messages

Use clear, descriptive commit messages:

```
feat: add user profile update endpoint
fix: resolve authentication token expiry issue
docs: update API documentation for webhooks
refactor: simplify CRUD service implementation
```

Prefixes:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `refactor`: Code refactoring
- `test`: Adding tests
- `chore`: Maintenance tasks

## Code Review

All contributions go through code review. Reviewers will check:
- Code quality and style
- Security considerations
- Documentation completeness
- Test coverage (when applicable)

Be open to feedback and willing to make changes.

## Security

If you discover a security vulnerability:
1. **DO NOT** open a public issue
2. Email the maintainers directly
3. Include details about the vulnerability
4. Wait for a response before disclosing publicly

## Questions?

- Check existing [documentation](docs/)
- Search [existing issues](https://github.com/ihoward40/ike-bot/issues)
- Open a new issue for questions

## License

By contributing, you agree that your contributions will be licensed under the same license as the project (MIT License).

## Recognition

Contributors will be recognized in the project README and release notes.

Thank you for contributing to IKE-BOT! 🚀
