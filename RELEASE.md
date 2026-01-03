# Release Guide for RuneQuest 3 Foundry VTT System

This guide explains how to create releases for the RuneQuest 3 system that can be installed and updated via Foundry VTT's manifest system.

## Prerequisites

- Git repository set up on GitHub
- GitHub repository URL: `https://github.com/Kittenjuggler/runequest3-foundry`
- Access to create releases on GitHub

## Release Methods

### Method 1: Automated Release via GitHub Actions (Recommended)

The repository includes a GitHub Actions workflow that automatically creates releases when you push a version tag.

#### Steps:

1. **Update the version in `system.json`**:
   ```json
   {
     "version": "1.0.7"
   }
   ```

2. **Commit and push your changes**:
   ```bash
   git add system.json
   git commit -m "Bump version to 1.0.7"
   git push
   ```

3. **Create and push a version tag**:
   ```bash
   git tag v1.0.7
   git push origin v1.0.7
   ```

4. **GitHub Actions will automatically**:
   - Create a release
   - Build the release package
   - Upload `runequest3-foundry.zip` and `system.json`
   - Create the release with proper manifest URLs

#### Manual Trigger (Alternative)

You can also trigger the workflow manually from the GitHub Actions tab:

1. Go to the "Actions" tab in your GitHub repository
2. Select "Create Release" workflow
3. Click "Run workflow"
4. Enter the version number (e.g., `1.0.7`)
5. Click "Run workflow"

### Method 2: Manual Release Script

If you prefer to create releases manually, use the provided scripts:

#### On Windows (PowerShell):

```powershell
.\scripts\create-release.ps1 1.0.7
```

#### On Linux/Mac (Bash):

```bash
chmod +x scripts/create-release.sh
./scripts/create-release.sh 1.0.7
```

This will:
- Update the version in `system.json`
- Create a clean release package
- Generate `runequest3-foundry.zip`
- Create `release/system.json` for the manifest

#### Then manually create the GitHub release:

1. Go to: https://github.com/Kittenjuggler/runequest3-foundry/releases/new
2. **Tag**: `v1.0.7` (must match the version)
3. **Title**: `Release v1.0.7`
4. **Description**: Add release notes
5. **Attach files**:
   - `runequest3-foundry.zip`
   - `release/system.json`
6. Click "Publish release"

## Manifest URL Structure

The `system.json` file already contains the correct manifest URLs:

```json
{
  "manifest": "https://github.com/Kittenjuggler/runequest3-foundry/releases/latest/download/system.json",
  "download": "https://github.com/Kittenjuggler/runequest3-foundry/releases/latest/download/runequest3-foundry.zip"
}
```

These URLs point to the `latest` release, which Foundry VTT will use to:
- Check for updates
- Download new versions
- Install the system

## Installation via Manifest URL

Users can install your system in Foundry VTT using:

```
https://github.com/Kittenjuggler/runequest3-foundry/releases/latest/download/system.json
```

Or for a specific version:

```
https://github.com/Kittenjuggler/runequest3-foundry/releases/download/v1.0.7/system.json
```

## Release Package Structure

The release package (`runequest3-foundry.zip`) should contain:

```
runequest3/
├── system.json
├── runequest3.mjs
├── README.md
├── module/
├── templates/
├── styles/
├── lang/
└── packs/
```

**Important**: The zip file should contain a `runequest3` folder, not the files directly.

## Version Numbering

Follow semantic versioning (semver):
- **Major** (1.0.0): Breaking changes
- **Minor** (0.1.0): New features, backward compatible
- **Patch** (0.0.1): Bug fixes, backward compatible

Examples:
- `1.0.0` - Initial release
- `1.0.1` - Bug fix
- `1.1.0` - New feature
- `2.0.0` - Breaking changes

## Updating the Manifest

The manifest file (`system.json` in the release) must:
1. Match the version in your repository's `system.json`
2. Be uploaded to each release
3. Point to the correct download URL

The GitHub Actions workflow handles this automatically.

## Troubleshooting

### Release not showing in Foundry VTT

1. Check that `system.json` is in the release assets
2. Verify the manifest URL is accessible
3. Ensure the version in `system.json` matches the release tag
4. Check that the zip file structure is correct (should contain `runequest3/` folder)

### Update not detected

1. Ensure the version number in `system.json` is incremented
2. Verify the manifest URL points to the latest release
3. Check that Foundry VTT can access the GitHub release

### Files excluded from release

The following are automatically excluded:
- `.git/` and `.github/`
- `node_modules/`
- Foundry database files (`*.ldb`, `*.log`, `LOCK`, etc.)
- `memory-bank/` (development documentation)
- `tatus` (temporary files)

## Best Practices

1. **Always test the release package** before publishing
2. **Update the README.md** with changelog information
3. **Tag releases** with `v` prefix (e.g., `v1.0.7`)
4. **Use semantic versioning** consistently
5. **Include release notes** describing changes
6. **Test installation** from the manifest URL in a fresh Foundry VTT instance

## Automated Release Checklist

- [ ] Update version in `system.json`
- [ ] Update changelog in `README.md`
- [ ] Commit changes
- [ ] Create and push version tag
- [ ] Verify GitHub Actions workflow completes successfully
- [ ] Test installation from manifest URL
- [ ] Verify update detection works

