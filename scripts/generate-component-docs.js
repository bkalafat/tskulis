/**
 * Component Documentation Generator
 * Generates comprehensive documentation for React components
 */

const fs = require('fs').promises;
const path = require('path');

// Component documentation template
const generateComponentDoc = (componentName, componentPath, metadata) => {
  return `# ${componentName}

## Overview
${metadata.description || 'Component description not provided.'}

## Import
\`\`\`tsx
import { ${componentName} } from '${componentPath}';
\`\`\`

## Props
${generatePropsTable(metadata.props)}

## Usage Examples
${generateUsageExamples(componentName, metadata.examples)}

## Variants
${generateVariantsSection(metadata.variants)}

## Accessibility
${generateAccessibilitySection(metadata.accessibility)}

## Notes
${generateNotesSection(metadata.notes)}

---
*Generated on ${new Date().toISOString()}*
`;
};

const generatePropsTable = (props) => {
  if (!props || Object.keys(props).length === 0) {
    return 'No props documented.';
  }

  let table = '| Prop | Type | Default | Required | Description |\n';
  table += '|------|------|---------|----------|-------------|\n';
  
  Object.entries(props).forEach(([propName, propInfo]) => {
    table += `| \`${propName}\` | \`${propInfo.type || 'any'}\` | \`${propInfo.default || '-'}\` | ${propInfo.required ? '✅' : '❌'} | ${propInfo.description || '-'} |\n`;
  });

  return table;
};

const generateUsageExamples = (componentName, examples) => {
  if (!examples || examples.length === 0) {
    return 'No usage examples provided.';
  }

  return examples.map((example, index) => `
### Example ${index + 1}: ${example.title}
\`\`\`tsx
${example.code}
\`\`\`
${example.description ? `\n${example.description}` : ''}
`).join('\n');
};

const generateVariantsSection = (variants) => {
  if (!variants || Object.keys(variants).length === 0) {
    return 'No variants documented.';
  }

  return Object.entries(variants).map(([variantName, variantInfo]) => `
### ${variantName}
${variantInfo.description || 'No description provided.'}

${variantInfo.example ? `\`\`\`tsx\n${variantInfo.example}\n\`\`\`` : ''}
`).join('\n');
};

const generateAccessibilitySection = (accessibility) => {
  if (!accessibility) {
    return 'No accessibility information provided.';
  }

  let content = '';
  if (accessibility.keyboardSupport) {
    content += '## Keyboard Support\n' + accessibility.keyboardSupport + '\n\n';
  }
  if (accessibility.ariaLabels) {
    content += '## ARIA Labels\n' + accessibility.ariaLabels + '\n\n';
  }
  if (accessibility.screenReader) {
    content += '## Screen Reader Support\n' + accessibility.screenReader + '\n\n';
  }

  return content || 'No specific accessibility features documented.';
};

const generateNotesSection = (notes) => {
  if (!notes || notes.length === 0) {
    return 'No additional notes.';
  }

  return notes.map(note => `- ${note}`).join('\n');
};

// Component metadata extraction
const extractComponentMetadata = async (componentPath) => {
  try {
    const content = await fs.readFile(componentPath, 'utf8');
    
    // Extract JSDoc comments and component information
    const metadata = {
      description: extractDescription(content),
      props: extractProps(content),
      examples: extractExamples(content),
      variants: extractVariants(content),
      accessibility: extractAccessibility(content),
      notes: extractNotes(content)
    };

    return metadata;
  } catch (error) {
    console.error(`Error reading component file ${componentPath}:`, error);
    return {};
  }
};

const extractDescription = (content) => {
  const descMatch = content.match(/\/\*\*\s*\n\s*\*\s*(.+?)\s*\n/);
  return descMatch ? descMatch[1] : null;
};

const extractProps = (content) => {
  const propsMatch = content.match(/interface\s+\w+Props\s*{([^}]+)}/);
  if (!propsMatch) return {};

  const propsContent = propsMatch[1];
  const props = {};
  
  const propLines = propsContent.split('\n').filter(line => line.trim());
  propLines.forEach(line => {
    const propMatch = line.match(/(\w+)(\?)?\s*:\s*([^;]+);?\s*(?:\/\/\s*(.+))?/);
    if (propMatch) {
      const [, name, optional, type, comment] = propMatch;
      props[name] = {
        type: type.trim(),
        required: !optional,
        description: comment ? comment.trim() : null
      };
    }
  });

  return props;
};

const extractExamples = (content) => {
  const examples = [];
  const exampleMatches = content.matchAll(/\/\*\*\s*@example\s*(.+?)\s*\*\//g);
  
  for (const match of exampleMatches) {
    examples.push({
      title: 'Basic Usage',
      code: match[1].trim(),
      description: null
    });
  }

  return examples;
};

const extractVariants = (content) => {
  const variants = {};
  const variantMatch = content.match(/variant\?\s*:\s*([^;]+);/);
  
  if (variantMatch) {
    const variantTypes = variantMatch[1].replace(/'/g, '').split('|').map(v => v.trim());
    variantTypes.forEach(variant => {
      variants[variant] = {
        description: `${variant} variant of the component`,
        example: null
      };
    });
  }

  return variants;
};

const extractAccessibility = (content) => {
  const accessibilityInfo = {};
  
  if (content.includes('aria-')) {
    accessibilityInfo.ariaLabels = 'Component supports ARIA labels for accessibility.';
  }
  
  if (content.includes('onKeyDown') || content.includes('tabIndex')) {
    accessibilityInfo.keyboardSupport = 'Component supports keyboard navigation.';
  }
  
  return Object.keys(accessibilityInfo).length > 0 ? accessibilityInfo : null;
};

const extractNotes = (content) => {
  const notes = [];
  const noteMatches = content.matchAll(/\/\*\*\s*@note\s*(.+?)\s*\*\//g);
  
  for (const match of noteMatches) {
    notes.push(match[1].trim());
  }

  return notes;
};

// Main documentation generation function
const generateComponentDocumentation = async () => {
  const componentsDir = path.join(__dirname, '..', 'src', 'components');
  const docsDir = path.join(__dirname, '..', 'docs', 'components');
  
  // Create docs directory if it doesn't exist
  await fs.mkdir(docsDir, { recursive: true });

  const generateDocsForDirectory = async (dir, relativePath = '') => {
    const items = await fs.readdir(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = await fs.stat(fullPath);
      
      if (stat.isDirectory()) {
        // Recursively process subdirectories
        await generateDocsForDirectory(fullPath, path.join(relativePath, item));
      } else if (item.endsWith('.tsx') && !item.includes('.test.') && !item.includes('.stories.')) {
        // Process component files
        const componentName = path.basename(item, '.tsx');
        const importPath = `@/components/${path.join(relativePath, componentName).replace(/\\/g, '/')}`;
        
        console.log(`Generating documentation for ${componentName}...`);
        
        const metadata = await extractComponentMetadata(fullPath);
        const documentation = generateComponentDoc(componentName, importPath, metadata);
        
        const docFileName = `${componentName}.md`;
        const docPath = path.join(docsDir, relativePath, docFileName);
        
        // Create subdirectory if needed
        await fs.mkdir(path.dirname(docPath), { recursive: true });
        await fs.writeFile(docPath, documentation);
        
        console.log(`✅ Documentation generated for ${componentName}`);
      }
    }
  };

  try {
    await generateDocsForDirectory(componentsDir);
    
    // Generate index file
    const indexContent = await generateIndexFile(docsDir);
    await fs.writeFile(path.join(docsDir, 'README.md'), indexContent);
    
    console.log('\n🎉 Component documentation generation completed!');
    console.log(`📁 Documentation available in: ${docsDir}`);
  } catch (error) {
    console.error('❌ Error generating component documentation:', error);
    process.exit(1);
  }
};

const generateIndexFile = async (docsDir) => {
  const components = [];
  
  const scanDirectory = async (dir, relativePath = '') => {
    const items = await fs.readdir(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = await fs.stat(fullPath);
      
      if (stat.isDirectory()) {
        await scanDirectory(fullPath, path.join(relativePath, item));
      } else if (item.endsWith('.md') && item !== 'README.md') {
        const componentName = path.basename(item, '.md');
        const relativeMdPath = path.join(relativePath, item).replace(/\\/g, '/');
        components.push({ name: componentName, path: relativeMdPath });
      }
    }
  };

  await scanDirectory(docsDir);

  let indexContent = `# Component Documentation

This directory contains comprehensive documentation for all React components in the TS Kulis application.

## Components

`;

  components.forEach(component => {
    indexContent += `- [${component.name}](./${component.path})\n`;
  });

  indexContent += `
## Documentation Guidelines

### Component Structure
Each component documentation includes:
- **Overview**: Brief description and purpose
- **Import**: How to import the component
- **Props**: Complete props interface with types and descriptions
- **Usage Examples**: Code examples showing different use cases
- **Variants**: Different visual or behavioral variants
- **Accessibility**: Keyboard support and ARIA information
- **Notes**: Additional implementation details

### Best Practices
1. Always provide meaningful prop descriptions
2. Include usage examples for common scenarios
3. Document accessibility features
4. Keep examples simple and focused
5. Update documentation when component interface changes

## Auto-generation
This documentation is automatically generated from component source code using JSDoc comments and TypeScript interfaces.

Run \`npm run docs:components\` to regenerate this documentation.

---
*Generated on ${new Date().toISOString()}*
`;

  return indexContent;
};

// Run the generator
if (require.main === module) {
  generateComponentDocumentation();
}

module.exports = {
  generateComponentDocumentation,
  extractComponentMetadata,
  generateComponentDoc
};