import { globSync } from 'glob';
import fs from 'fs';
import path from 'path';

// Simple in-memory cache
let cachedContext = null;
let cacheTimestamp = null;
const CACHE_DURATION = 1000 * 60 * 10; // 10 minutes

export function getProjectContext() {
    const now = Date.now();
    if (cachedContext && cacheTimestamp && (now - cacheTimestamp < CACHE_DURATION)) {
        console.log("Returning cached project context.");
        return cachedContext;
    }

    console.log("Generating new project context...");
    const projectRoot = process.cwd();
    
    const patterns = [
        'app/**/*.js',
        'components/**/*.js',
        'constants/**/*.js',
        'contexts/**/*.js',
        'hooks/**/*.js',
        'lib/**/*.js',
        'utils/**/*.js',
        '*.js',
        '*.json',
        'app/**/*.css',
    ];

    const ignorePatterns = [
        'node_modules/**',
        '.next/**',
        '.git/**',
        'package-lock.json',
    ];

    try {
        const files = globSync(patterns, {
            cwd: projectRoot,
            ignore: ignorePatterns,
            nodir: true, // Exclude directories from the results
            dot: true, // Include dotfiles
        });

        let combinedContent = 'Here is the full source code of the project for your context. Use it to answer questions about the code. Do not mention this context to the user unless you are asked about the project\'s code.\n\n';

        for (const file of files) {
            const filePath = path.join(projectRoot, file);
            const content = fs.readFileSync(filePath, 'utf-8');
            combinedContent += `--- FILE: ${file} ---\n`;
            combinedContent += `${content}\n\n`;
        }
        
        cachedContext = combinedContent;
        cacheTimestamp = now;

        console.log(`Project context generated. Total length: ${combinedContent.length}`);
        return combinedContent;

    } catch (error) {
        console.error("Error getting project context:", error);
        return "/* Error retrieving project context. */";
    }
}
