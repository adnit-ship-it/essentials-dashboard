# Essentials Dashboard

A multi-repository content management dashboard for managing website content, products, branding, and assets across multiple GitHub repositories.

## Features

- 🔄 **Multi-Repository Support**: Manage content across multiple repositories from a single dashboard
- 🎨 **Brand Management**: Update branding colors and logos
- 📦 **Product Management**: Manage product catalogs
- 🖼️ **Asset Management**: Upload and manage images and assets
- 📝 **Content Management**: Edit website content and text
- 🔐 **GitHub App Integration**: Secure authentication via GitHub App

## Prerequisites

- Node.js 18+ and npm/yarn/pnpm
- A GitHub App with the following permissions:
  - Repository access (read/write)
  - Contents (read/write)
  - Metadata (read)
- GitHub App credentials:
  - Client ID
  - Private Key
  - Installation ID

## Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd essentials-dashboard
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
# or
pnpm install
```

### 3. Configure Environment Variables

Create a `.env.local` file in the root directory:

```env
# GitHub App Authentication (Required)
GITHUB_APP_CLIENT_ID=your_github_app_client_id
GITHUB_PRIVATE_KEY=your_github_app_private_key
GITHUB_INSTALLATION_ID=your_github_installation_id

# Optional: Legacy repository configuration (for backward compatibility)
# These are only used if no repository is configured via the UI
CONTENT_REPO_OWNER=your_org_name
CONTENT_REPO_NAME=your_repo_name
CONTENT_REPO_BRANCH=main
CONTENT_FILE_PATH=data/websiteText.json
CONTENT_PRODUCTS_FILE_PATH=data/intake-form/products.ts
CONTENT_TAILWIND_PATH=tailwind.config.js
CONTENT_BRAND_LOGO_PATH=public/assets/images/brand/logo.svg
CONTENT_BRAND_ALT_LOGO_PATH=public/assets/images/brand/logo-alt.svg
```

**Note**: The legacy environment variables are optional and only used as a fallback. The recommended approach is to configure repositories through the UI.

### 4. Run the Development Server

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

The dashboard will be available at:
- Frontend: [http://localhost:3000](http://localhost:3000)
- Backend API: [http://localhost:3001](http://localhost:3001)

## Usage

### First-Time Setup

1. **Open the Dashboard**: Navigate to [http://localhost:3000](http://localhost:3000)

2. **Configure a Repository**:
   - Click "Configure Repository" in the sidebar
   - Select a repository from the list (repositories are automatically discovered from your GitHub App installation)
   - Enter the file paths for:
     - Content file (e.g., `data/websiteText.json`)
     - Products file (e.g., `data/intake-form/products.ts`)
     - Tailwind config (e.g., `tailwind.config.js`)
     - Brand logo paths
   - Click "Test Connection" to validate the paths
   - Click "Save Configuration" to save

3. **Switch Between Repositories**:
   - Use the repository selector dropdown in the sidebar
   - All data will automatically reload when switching repositories

### Managing Content

- **Content Management**: Edit website text and content
- **Products**: Manage product catalogs and intake forms
- **Branding**: Update brand colors and logos
- **Assets**: Upload and manage images and other assets

All changes are committed directly to the configured GitHub repository.

## Architecture

### Multi-Repository Support

The dashboard supports managing multiple repositories through:

1. **Automatic Discovery**: Repositories are automatically discovered from your GitHub App installation
2. **User Configuration**: Each repository can be configured with custom file paths via the UI
3. **Persistent Storage**: Repository configurations are stored in `data/repo-configs.json`
4. **State Management**: Frontend uses Zustand for repository state management

### Repository Configuration

Repository configurations include:
- Repository owner and name
- Default branch
- File paths for content, products, branding, and assets
- Display name (optional)
- Last accessed timestamp

### API Endpoints

- `GET /api/repositories` - List all available repositories
- `POST /api/repositories/:repoId/configure` - Configure a repository
- `POST /api/repositories/:repoId/test` - Test repository connection
- `GET /api/repositories/:repoId` - Get repository configuration
- `DELETE /api/repositories/:repoId` - Delete repository configuration
- `GET /api/content?repoId=owner/repo` - Get content for a repository
- `GET /api/products?repoId=owner/repo` - Get products for a repository
- `GET /api/branding?repoId=owner/repo` - Get branding for a repository
- `GET /api/assets?repoId=owner/repo` - Get assets for a repository

## Project Structure

```
essentials-dashboard/
├── app/                    # Next.js app directory
├── components/             # React components
│   ├── features/          # Feature-specific components
│   │   └── repository/    # Repository management components
│   ├── layout/            # Layout components
│   └── pages/             # Page components
├── lib/                   # Library code
│   ├── services/          # Business logic services
│   ├── stores/            # Zustand stores
│   └── types/             # TypeScript types
├── data/                  # Data storage (gitignored)
│   └── repo-configs.json  # Repository configurations
├── server.ts              # Express backend server
└── .env.local             # Environment variables (gitignored)
```

## Development

### Adding a New Repository

1. Ensure the repository is accessible through your GitHub App installation
2. Open the dashboard and click "Configure Repository"
3. Select the repository and configure file paths
4. Test the connection and save

### Troubleshooting

**Repository not appearing in list**:
- Verify the repository is accessible through your GitHub App installation
- Check that `GITHUB_INSTALLATION_ID` is correct

**File paths not working**:
- Use the "Test Connection" feature to validate paths
- Ensure paths are relative to the repository root
- Check that files exist in the specified branch

**Colors not updating**:
- Verify the tailwind config file path is correct
- Check that the tailwind config file format matches expected patterns
- Ensure you have write permissions to the repository

## License

[Add your license here]

## Support

[Add support information here]
