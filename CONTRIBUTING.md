# Contributing to EventSphere

First off, thank you for considering contributing to EventSphere! It's people like you that make EventSphere such a great tool for event safety professionals.

## 🤝 Code of Conduct

This project and everyone participating in it is governed by respect, professionalism, and collaboration. By participating, you are expected to uphold this code.

## 🚀 How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check existing issues to avoid duplicates. When creating a bug report, include:

- **Clear title and description**
- **Steps to reproduce**
- **Expected vs actual behavior**
- **Screenshots** (if applicable)
- **Environment details** (OS, browser, Node version)

**Example:**
```markdown
**Bug:** Command palette doesn't open with Cmd+K on Safari

**Steps to Reproduce:**
1. Open app in Safari 17.x
2. Press Cmd+K
3. Nothing happens

**Expected:** Command palette should open
**Actual:** No response
**Environment:** macOS 14.1, Safari 17.2
```

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion:

- **Use a clear title**
- **Provide detailed description**
- **Explain why this enhancement would be useful**
- **List any alternatives you've considered**

### Pull Requests

1. **Fork the repo** and create your branch from `main`
2. **Make your changes**
3. **Add tests** if applicable
4. **Ensure tests pass** (`pnpm test`)
5. **Lint your code** (`pnpm lint`)
6. **Format code** (`pnpm format`)
7. **Update documentation** if needed
8. **Create a pull request**

## 📝 Development Process

### Setup Development Environment

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/eventsphere.git
cd eventsphere

# Install dependencies
pnpm install

# Copy environment file
cp .env.example .env

# Start dev server
pnpm dev
```

### Branch Naming Convention

- `feature/` - New features (`feature/add-video-surveillance`)
- `fix/` - Bug fixes (`fix/command-palette-safari`)
- `docs/` - Documentation (`docs/update-api-guide`)
- `refactor/` - Code refactoring (`refactor/event-store`)
- `test/` - Adding tests (`test/alert-component`)

### Commit Message Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation
- `style:` - Formatting (no code change)
- `refactor:` - Code restructuring
- `test:` - Adding tests
- `chore:` - Maintenance tasks

**Examples:**
```bash
feat(maps): add polygon drawing tool
fix(alerts): resolve duplicate notification issue
docs(readme): update installation instructions
test(events): add event creation tests
```

### Code Style

We use ESLint and Prettier for code style:

```bash
# Check linting
pnpm lint

# Auto-fix linting issues
pnpm lint:fix

# Format code
pnpm format

# Type check
pnpm type-check
```

**Style Guidelines:**
- Use TypeScript for all new files
- Use functional components with hooks
- Prefer named exports over default
- Write descriptive variable names
- Add comments for complex logic
- Keep functions small and focused

### Testing

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test --watch

# Run tests with UI
pnpm test:ui

# Generate coverage
pnpm test --coverage
```

**Testing Guidelines:**
- Write tests for new features
- Update tests when modifying features
- Aim for >80% code coverage
- Test edge cases
- Mock external dependencies

### Pull Request Process

1. **Update your fork**
   ```bash
   git remote add upstream https://github.com/Coder-God2901/Eventsphere.git
   git fetch upstream
   git rebase upstream/main
   ```

2. **Create feature branch**
   ```bash
   git checkout -b feature/my-awesome-feature
   ```

3. **Make changes and commit**
   ```bash
   git add .
   git commit -m "feat(feature): add awesome feature"
   ```

4. **Push to your fork**
   ```bash
   git push origin feature/my-awesome-feature
   ```

5. **Create Pull Request**
   - Go to GitHub and create PR
   - Fill out PR template
   - Link related issues
   - Request review

### PR Checklist

Before submitting, ensure:

- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] No new warnings generated
- [ ] Tests added/updated
- [ ] All tests pass
- [ ] TypeScript builds without errors
- [ ] Works on Chrome, Firefox, Safari

## 🏗️ Project Structure

```
src/
├── components/      # React components
│   ├── features/   # Feature components
│   ├── shared/     # Reusable components
│   └── ui/         # Base UI components
├── store/          # Zustand stores
├── hooks/          # Custom hooks
├── services/       # API services
├── lib/            # Utilities
├── providers/      # Context providers
├── data/           # Mock data
├── styles/         # Global styles
└── test/           # Test utilities
```

## 🎨 Design Guidelines

### Component Guidelines

```typescript
// ✅ Good
export function MyComponent({ title, onAction }: MyComponentProps) {
  const [state, setState] = useState(false);
  
  return (
    <div className="flex items-center gap-2">
      <h2>{title}</h2>
      <Button onClick={onAction}>Action</Button>
    </div>
  );
}

// ❌ Avoid
function myComponent(props) {
  return <div style={{ display: 'flex' }}>{props.title}</div>;
}
```

### TypeScript Guidelines

```typescript
// ✅ Define types
interface User {
  id: string;
  name: string;
  role: UserRole;
}

// ✅ Use enums
enum UserRole {
  Admin = 'admin',
  Coordinator = 'coordinator',
}

// ❌ Avoid any
const data: any = fetchData(); // Bad
const data: User = fetchData(); // Good
```

### State Management

```typescript
// ✅ Use Zustand stores for global state
const { events, addEvent } = useEventStore();

// ✅ Use local state for component-specific
const [isOpen, setIsOpen] = useState(false);

// ✅ Use React Query for server state
const { data } = useEvents();
```

## 📚 Documentation

When adding new features:

1. **Update README.md** if adding major feature
2. **Add JSDoc comments** to functions
3. **Update IMPLEMENTATION.md** with usage guide
4. **Add inline comments** for complex logic

```typescript
/**
 * Creates a new event with validation
 * @param event - Event data to create
 * @returns Created event with generated ID
 * @throws {ValidationError} If event data is invalid
 */
export async function createEvent(event: Partial<Event>): Promise<Event> {
  // Implementation
}
```

## 🐛 Debugging

### Common Issues

**Issue: TypeScript errors after pulling latest**
```bash
# Solution: Reinstall dependencies
pnpm install
```

**Issue: Tests failing**
```bash
# Solution: Clear cache and rerun
pnpm test --clearCache
pnpm test
```

**Issue: Lint errors**
```bash
# Solution: Auto-fix
pnpm lint:fix
pnpm format
```

### Debug Tools

- **React DevTools** - Component inspection
- **Redux DevTools** - Zustand state inspection
- **React Query DevTools** - API cache inspection
- **VS Code Debugger** - Breakpoint debugging

## 🎯 Priority Areas

We're especially interested in contributions for:

- 🗺️ **Maps Integration** - Leaflet/Mapbox implementation
- 🔐 **Authentication** - JWT auth system
- 📱 **Mobile UX** - Responsive improvements
- 🧪 **Testing** - Increasing test coverage
- 📖 **Documentation** - Guides and examples
- 🌍 **Internationalization** - Multi-language support

## 📞 Getting Help

- **Questions:** Open a GitHub Discussion
- **Bugs:** Create an issue with bug template
- **Features:** Create an issue with feature template
- **Chat:** Join our Discord (if available)

## 🏆 Recognition

Contributors will be:
- Listed in README.md
- Mentioned in release notes
- Given credit in documentation

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

**Thank you for making EventSphere better! 🎉**
