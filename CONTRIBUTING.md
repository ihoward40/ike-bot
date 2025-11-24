# Contributing to IKE BOT

Thank you for your interest in contributing to IKE BOT! This document provides guidelines and instructions for contributing to the project.

## Development Setup

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/your-username/ike-bot.git
   cd ike-bot
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Create a `.env` file with your Supabase credentials
5. Run the development server:
   ```bash
   npm run dev
   ```

## Project Structure

```
src/
├── config/          # Configuration files (Supabase, etc.)
├── controllers/     # Business logic for each resource
├── models/          # TypeScript type definitions
├── routes/          # Express route definitions
├── middleware/      # Express middleware
└── server.ts        # Main application entry point

supabase/
└── migrations/      # Database schema migration files

test/                # Test files
```

## Coding Standards

### TypeScript
- Use TypeScript for all new code
- Enable strict mode
- Define explicit types for function parameters and return values
- Use interfaces for object shapes

### Code Style
- Use 2 spaces for indentation
- Use semicolons
- Use double quotes for strings
- Use async/await instead of promises where possible
- Keep functions small and focused

### Naming Conventions
- Use camelCase for variables and functions
- Use PascalCase for types and interfaces
- Use kebab-case for file names (except components)
- Use descriptive names that convey intent

## Git Workflow

1. Create a feature branch from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes and commit them:
   ```bash
   git add .
   git commit -m "Description of your changes"
   ```

3. Push to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```

4. Open a Pull Request against the `main` branch

## Pull Request Guidelines

- Keep PRs focused and small
- Include a clear description of what your PR does
- Reference any related issues
- Ensure all tests pass
- Add tests for new features
- Update documentation as needed

## Testing

### Running Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Writing Tests
- Write tests for all new features
- Use Jest and Supertest for API testing
- Follow the existing test structure in the `test/` directory
- Aim for high test coverage

## Database Migrations

When adding new database features:

1. Create a new migration file in `supabase/migrations/`
2. Use sequential numbering (e.g., `004_add_new_table.sql`)
3. Include both UP and DOWN migrations when possible
4. Test your migration locally before submitting

## API Development

When adding new API endpoints:

1. Create/update the controller in `src/controllers/`
2. Add routes in `src/routes/`
3. Update the server.ts to include the new routes
4. Add TypeScript types in `src/models/types.ts`
5. Write tests in `test/`
6. Document the endpoint in `API.md`

## Commit Message Format

Use clear and descriptive commit messages:

```
<type>: <subject>

<body>

<footer>
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

Example:
```
feat: add search endpoint for beneficiaries

- Add GET /api/beneficiaries/search endpoint
- Support filtering by name, email, and trust_id
- Add tests for search functionality
```

## Questions?

If you have questions or need help, please:
- Open an issue on GitHub
- Reach out to the maintainers

Thank you for contributing! 🎉
