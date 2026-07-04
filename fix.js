const fs = require('fs');
const path = require('path');

function replaceInFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;
    
    // Pattern to match: supabase.channel('string') or supabase.channel(`string`)
    content = content.replace(/supabase\.channel\((['"`])(.*?)\1\)/g, (match, quote, channelName) => {
        if (channelName.includes('Date.now()')) return match;
        changed = true;
        return `supabase.channel(\`${channelName}_\${Date.now()}\`)`;
    });

    // Special case for useSidebarIntelligence: supabase.channel(channelId)
    content = content.replace(/supabase\.channel\(channelId\)/g, () => {
        changed = true;
        return 'supabase.channel(`${channelId}_${Date.now()}`)';
    });

    if (changed) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('Fixed', filePath);
    }
}

function traverse(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            traverse(fullPath);
        } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
            replaceInFile(fullPath);
        }
    }
}

traverse('src');
