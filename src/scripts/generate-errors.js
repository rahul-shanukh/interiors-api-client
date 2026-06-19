//src/scripts/generate-errors.js

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

// Paths
const ERRORS_DIR = path.join(__dirname, '../common/constants/errors');
const OUTPUT_DIR = path.join(__dirname, '../common/constants');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'error-codes.generated.ts');

console.log('🔄 Scanning /errors directory for YAML files...');

try {
  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // 1. Get all .yml files in the directory
  const files = fs
    .readdirSync(ERRORS_DIR)
    .filter((file) => file.endsWith('.yml') || file.endsWith('.yaml'));

  if (files.length === 0) {
    console.warn('⚠️ No YAML files found in the errors directory.');
    process.exit(0);
  }

  // 2. Start building the TypeScript string
  let tsContent = `// 🛑 AUTO-GENERATED FILE - DO NOT EDIT DIRECTLY\n`;
  tsContent += `// Update files in the /errors folder and run the generator script to change this file.\n\n`;

  // 3. Loop through every file and parse it
  for (const file of files) {
    const filePath = path.join(ERRORS_DIR, file);
    const fileContents = fs.readFileSync(filePath, 'utf8');
    const data = yaml.load(fileContents);

    // 4. Extract the module names (e.g., "Common", "Auth") and their errors
    for (const [moduleName, errors] of Object.entries(data || {})) {
      tsContent += `export const ${moduleName}ErrorCode = {\n`;

      for (const [errorKey, errorData] of Object.entries(errors)) {
        // Adds the code and puts the plain English message as a TS comment for context!
        tsContent += `  ${errorKey}: '${errorData.code}', // ${errorData.message}\n`;
      }

      tsContent += `} as const;\n\n`;
    }
  }

  // 5. Write the final merged string to the TypeScript file
  fs.writeFileSync(OUTPUT_FILE, tsContent);
  console.log(
    `✅ Successfully generated error codes from ${files.length} files at: src/common/constants/error-codes.generated.ts`,
  );
} catch (e) {
  console.error('❌ Failed to generate error codes:', e);
  process.exit(1);
}
