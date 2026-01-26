#!/bin/bash

# Backend Refactoring Script
# This script moves files to the new modular structure

echo "🔧 Starting backend refactoring..."

# Create directory structure if needed
mkdir -p core/agent/skills
mkdir -p core/workflow
mkdir -p core/editor
mkdir -p core/controllers
mkdir -p core/services
mkdir -p core/renderer

# Move agent files
echo "📦 Moving agent files..."
cp -r agent/* core/agent/
cp agent/skills/skillsIndex.ts core/agent/skills/
cp agent/skills/skillsRouter.ts core/agent/skills/
cp -r agent/skills/rules core/agent/skills/

# Move workflow files
echo "📦 Moving workflow files..."
cp -r workflow/* core/workflow/

# Move editor files
echo "📦 Moving editor files..."
cp -r editor/* core/editor/

# Move controllers
echo "📦 Moving controllers..."
cp controllers/scriptController.ts core/controllers/script.controller.ts
cp controllers/videoController.ts core/controllers/video.controller.ts
cp controllers/utilityController.ts core/controllers/utility.controller.ts

# Move services
echo "📦 Moving services..."
cp services/scriptService.ts core/services/script.service.ts
cp services/videoService.ts core/services/video.service.ts
cp services/fileService.ts core/services/file.service.ts

# Move renderer
echo "📦 Moving renderer..."
cp renderer/remotionRenderer.ts core/renderer/

echo "✅ Files moved successfully!"
echo "⚠️  Note: You will need to update import paths in the moved files"
