# AGENTS.md - Helpium School Help Desk

Frontend-only project for a school help desk system with three user roles (professor, técnico, direção). Uses localStorage for persistence.

## Project Structure

```
helpium/
├── index.html            Landing page (marketing)
├── login.html            Login page
├── cadastro.html         Registration page
├── home.html             Redirect/welcome page after login
├── dashboard/            Authenticated app pages
│   ├── direcao.html
│   ├── professor.html
│   ├── professor-perfil.html
│   ├── tecnico.html
│   └── tecnico-perfil.html
├── css/
│   ├── shared/           Design tokens, reset, shared components, responsive, dark mode
│   │   ├── variables.css
│   │   ├── base.css
│   │   ├── components.css
│   │   ├── dashboard.css
│   │   ├── responsive.css
│   │   └── dark-mode.css
│   ├── pages/            Page-specific styles
│   │   ├── direcao.css
│   │   ├── professor.css
│   │   ├── tecnico.css
│   │   └── perfil.css
│   └── legacy/           Legacy styles (login/cadastro)
│       └── styles.css
├── js/
│   ├── core/             Independent utility modules
│   │   ├── auth.js       Auth: getCurrentUser, logout, requireAuth
│   │   ├── toast.js      Toast: show, success, error, warning, info
│   │   ├── skeleton.js   SkeletonLoader: shimmer placeholders
│   │   └── dark-mode.js  DarkMode: theme toggle + system preference
│   ├── components/       Reusable UI components
│   │   ├── sidebar.js    Sidebar: desktop expand/collapse + mobile toggle
│   │   ├── user-menu.js  UserMenu: dropdown + click-outside/Escape
│   │   ├── navigation.js Navigation: section switching + hash routing
│   │   └── profile.js    ProfilePage: photo management + info display
│   └── pages/            Page-specific logic
│       ├── tecnico.js    TecnicoPage: ticket attendance & funnel resolution
│       ├── professor.js  ProfessorPage: ticket CRUD
│       └── direcao.js    DirecaoPage: user/resource management
├── tools/
│   └── validate.js       Validation script for resource references
└── AGENTS.md
```

## Conventions

### CSS Loading Order (dashboard pages)
1. `css/shared/variables.css` — design tokens
2. `css/shared/base.css` — reset, base, keyframes
3. `css/shared/components.css` — shared components (sidebar, header, modal, toast)
4. `css/shared/dashboard.css` — dashboard widgets (stat cards, tables, forms)
5. `css/shared/responsive.css` — breakpoints
6. `css/pages/{page}.css` — page-specific overrides
7. `css/shared/dark-mode.css` — last (guarantees cascade wins)

### JS Loading Order (dashboard pages)
1. `js/core/dark-mode.js`
2. `js/core/auth.js`
3. `js/core/toast.js`
4. `js/core/skeleton.js`
5. `js/components/sidebar.js`
6. `js/components/user-menu.js`
7. `js/components/navigation.js`
8. `js/pages/{page}.js`

Initialization at end of body:
```js
DarkMode.init();
PageName.init();
```

### Data Storage (localStorage)
- `helpium_logged_user` — current user session `{ name, email, role }`
- `helpium_tickets` — all tickets (shared between professor/técnico)
- `helpium_professor_tickets` — legacy alias, kept in sync
- `helpium_users` — user management list (direção)
- `helpium_resources` — resource/space management (direção)
- `helpium_{role}_photo` — profile photo per role
- `helpium-theme` — `light` or `dark`

### Running Validation
```bash
node tools/validate.js
```
Checks resource references, JS syntax, HTML structure, and inline styles.

### Code Style
- Use double quotes for strings
- 2-space indentation
- No semicolons at end of statements (except where needed to prevent ASI issues)
- Template literals for multi-line HTML generation
- `escapeHtml()` helper for user-generated content in templates
