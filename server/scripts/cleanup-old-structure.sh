#!/bin/bash

# Server Structure Cleanup Script
# Safely removes old duplicated directories after refactoring

set -e

echo "🧹  Server Structure Cleanup Script"
echo "====================================="
echo ""
echo "This script will:"
echo "  1. Create a backup of old structure"
echo "  2. Remove duplicated old directories"
echo "  3. Keep only the new refactored structure"
echo ""

# Check if we're in the right directory
if [ ! -d "core" ] || [ ! -d "api" ]; then
    echo "❌ Error: Not in server directory or new structure doesn't exist"
    echo "   Expected to find 'core/' and 'api/' directories"
    exit 1
fi

# Check if old directories exist
if [ ! -d "agent" ] && [ ! -d "services" ]; then
    echo "ℹ️  Old structure already cleaned up!"
    exit 0
fi

# Create backup
echo "📦 Step 1: Creating backup..."
BACKUP_DIR="../backups"
BACKUP_FILE="$BACKUP_DIR/server-old-structure-$(date +%Y%m%d-%H%M%S).tar.gz"

mkdir -p "$BACKUP_DIR"

# List what will be backed up
echo "   Backing up:"
for dir in agent workflow editor controllers services renderer routes; do
    if [ -d "$dir" ]; then
        echo "     - $dir/"
    fi
done

if [ -f "index.oldbackup.ts" ]; then
    echo "     - index.oldbackup.ts"
fi

# Create the backup
tar -czf "$BACKUP_FILE" \
    agent/ \
    workflow/ \
    editor/ \
    controllers/ \
    services/ \
    renderer/ \
    routes/ \
    index.oldbackup.ts \
    2>/dev/null || true

if [ -f "$BACKUP_FILE" ]; then
    BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    echo "   ✅ Backup created: $BACKUP_FILE ($BACKUP_SIZE)"
else
    echo "   ⚠️  Warning: Backup may have failed"
    read -p "   Continue anyway? (yes/no): " continue_anyway
    if [ "$continue_anyway" != "yes" ]; then
        echo "   ❌ Cleanup cancelled"
        exit 1
    fi
fi

echo ""

# Ask for confirmation
echo "⚠️  Step 2: Confirmation Required"
echo ""
echo "This will PERMANENTLY remove these directories:"
echo "  - agent/"
echo "  - workflow/"
echo "  - editor/"
echo "  - controllers/"
echo "  - services/"
echo "  - renderer/"
echo "  - routes/"
echo "  - index.oldbackup.ts (if exists)"
echo ""
echo "The new structure in core/ and api/ will remain."
echo ""
read -p "Type 'DELETE' to confirm removal: " confirm

if [ "$confirm" != "DELETE" ]; then
    echo "❌ Cleanup cancelled - nothing was deleted"
    exit 0
fi

echo ""

# Remove old directories
echo "🗑️  Step 3: Removing old structure..."

removed_count=0

for dir in agent workflow editor controllers services renderer routes; do
    if [ -d "$dir" ]; then
        echo "   Removing $dir/..."
        rm -rf "$dir/"
        removed_count=$((removed_count + 1))
    fi
done

if [ -f "index.oldbackup.ts" ]; then
    echo "   Removing index.oldbackup.ts..."
    rm -f "index.oldbackup.ts"
    removed_count=$((removed_count + 1))
fi

echo "   ✅ Removed $removed_count items"
echo ""

# Show final structure
echo "📊 Step 4: Verification"
echo ""
echo "Current directory structure:"
ls -la | grep "^d" | grep -v "^d.*\.$" | awk '{print "  ✓ " $NF "/"}'
echo ""

echo "TypeScript files remaining:"
TS_COUNT=$(find . -name "*.ts" -not -path "*/node_modules/*" | wc -l | tr -d ' ')
echo "  Total: $TS_COUNT files"
echo ""

# Final summary
echo "✅ Cleanup Complete!"
echo ""
echo "Summary:"
echo "  • Backup: $BACKUP_FILE"
echo "  • Removed: $removed_count items"
echo "  • Structure: Refactored only"
echo ""
echo "Next steps:"
echo "  1. Test the server: npm run dev"
echo "  2. Verify all endpoints work"
echo "  3. If issues arise, restore from backup"
echo ""
echo "🎉 Server now uses the refactored structure exclusively!"
