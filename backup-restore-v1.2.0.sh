#!/bin/bash

# WaxValue Backup & Restore Script for v1.2.0
# This script allows easy backup and restoration of the v1.2.0 milestone

echo "🔄 WaxValue Backup & Restore Script v1.2.0"
echo "=========================================="

case "$1" in
    "backup")
        echo "📦 Creating backup of current version..."
        git archive --format=tar.gz --output=waxvalue-backup-$(date +%Y%m%d-%H%M%S).tar.gz HEAD
        echo "✅ Backup created: waxvalue-backup-$(date +%Y%m%d-%H%M%S).tar.gz"
        ;;
    "restore")
        echo "🔄 Restoring to v1.2.0 milestone..."
        git checkout v1.2.0
        echo "✅ Restored to v1.2.0"
        echo "📝 Note: You may need to run 'npm install' and 'npm run build'"
        ;;
    "info")
        echo "📋 Milestone v1.2.0 Information:"
        echo "   - Tag: v1.2.0"
        echo "   - Date: December 2024"
        echo "   - Status: UI/UX improvements and bug fixes complete"
        echo "   - Documentation: MILESTONE_v1.2.0.md"
        echo ""
        echo "📊 Recent commits:"
        git log --oneline -10
        ;;
    *)
        echo "Usage: $0 {backup|restore|info}"
        echo ""
        echo "Commands:"
        echo "  backup  - Create a backup archive of current version"
        echo "  restore - Restore to v1.2.0 milestone"
        echo "  info    - Show milestone information and recent commits"
        echo ""
        echo "Examples:"
        echo "  $0 backup   # Create backup"
        echo "  $0 restore  # Restore to v1.2.0"
        echo "  $0 info     # Show information"
        exit 1
        ;;
esac
