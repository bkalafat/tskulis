/**
 * Documentation Validation Script
 * Validates documentation completeness and quality
 */

const fs = require('fs').promises;
const path = require('path');

class DocumentationValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.componentsDir = path.join(__dirname, '..', 'src', 'components');
    this.docsDir = path.join(__dirname, '..', 'docs', 'components');
  }

  async validate() {
    console.log('🔍 Starting documentation validation...\n');

    await this.validateComponentCoverage();
    await this.validateDocumentationQuality();
    await this.validateLinks();
    await this.validateExamples();

    this.printReport();
    return this.errors.length === 0;
  }

  async validateComponentCoverage() {
    console.log('📋 Checking component documentation coverage...');

    const components = await this.getComponentFiles();
    const docs = await this.getDocumentationFiles();

    const componentNames = components.map(comp => 
      path.basename(comp, path.extname(comp))
    );
    const docNames = docs.map(doc => 
      path.basename(doc, '.md')
    );

    // Check for missing documentation
    const missingDocs = componentNames.filter(comp => 
      !docNames.includes(comp) && 
      !comp.includes('.test') && 
      !comp.includes('.stories')
    );

    if (missingDocs.length > 0) {
      this.errors.push(`Missing documentation for components: ${missingDocs.join(', ')}`);
    }

    // Check for orphaned documentation
    const orphanedDocs = docNames.filter(doc => 
      !componentNames.includes(doc) && 
      doc !== 'README'
    );

    if (orphanedDocs.length > 0) {
      this.warnings.push(`Orphaned documentation files: ${orphanedDocs.join(', ')}`);
    }

    console.log(`✅ Found ${components.length} components, ${docs.length} documentation files`);
  }

  async validateDocumentationQuality() {
    console.log('📝 Validating documentation quality...');

    const docs = await this.getDocumentationFiles();

    for (const docFile of docs) {
      if (path.basename(docFile) === 'README.md') continue;

      const content = await fs.readFile(docFile, 'utf8');
      const componentName = path.basename(docFile, '.md');

      await this.validateDocumentStructure(content, componentName);
      await this.validateDocumentContent(content, componentName);
    }

    console.log('✅ Documentation quality validation completed');
  }

  async validateDocumentStructure(content, componentName) {
    const requiredSections = [
      '# ' + componentName,
      '## Overview',
      '## Import',
      '## Props',
      '## Usage Examples'
    ];

    for (const section of requiredSections) {
      if (!content.includes(section)) {
        this.errors.push(`${componentName}: Missing required section "${section}"`);
      }
    }

    // Check for proper heading hierarchy
    const headings = content.match(/^#+\s+.+$/gm) || [];
    let lastLevel = 0;

    for (const heading of headings) {
      const level = heading.match(/^#+/)[0].length;
      if (level > lastLevel + 1 && lastLevel > 0) {
        this.warnings.push(`${componentName}: Heading hierarchy skip detected: "${heading}"`);
      }
      lastLevel = level;
    }
  }

  async validateDocumentContent(content, componentName) {
    // Check for empty sections
    const emptySections = content.match(/^##\s+.+$\n\n(?=##|$)/gm);
    if (emptySections) {
      this.warnings.push(`${componentName}: Contains empty sections`);
    }

    // Check for code examples
    const codeBlocks = content.match(/```[\s\S]*?```/g) || [];
    if (codeBlocks.length === 0) {
      this.warnings.push(`${componentName}: No code examples found`);
    }

    // Validate TypeScript code blocks
    for (const block of codeBlocks) {
      if (block.includes('```tsx') || block.includes('```typescript')) {
        const code = block.replace(/```(tsx|typescript)?\n?/, '').replace(/```$/, '');
        
        // Basic syntax checks
        if (code.includes('import') && !code.includes('from')) {
          this.errors.push(`${componentName}: Invalid import statement in code example`);
        }

        if (code.includes('<') && !code.includes('>')) {
          this.errors.push(`${componentName}: Malformed JSX in code example`);
        }
      }
    }

    // Check for prop documentation
    if (content.includes('## Props') && content.includes('No props documented.')) {
      this.warnings.push(`${componentName}: No props documented - consider documenting component interface`);
    }
  }

  async validateLinks() {
    console.log('🔗 Validating internal links...');

    const docs = await this.getDocumentationFiles();
    const allFiles = docs.map(doc => path.basename(doc, '.md'));

    for (const docFile of docs) {
      const content = await fs.readFile(docFile, 'utf8');
      const componentName = path.basename(docFile, '.md');

      // Find markdown links
      const links = content.match(/\[([^\]]+)\]\(([^)]+)\)/g) || [];

      for (const link of links) {
        const match = link.match(/\[([^\]]+)\]\(([^)]+)\)/);
        if (!match) continue;

        const [, text, href] = match;

        // Skip external links
        if (href.startsWith('http') || href.startsWith('mailto:')) continue;

        // Check internal file links
        if (href.endsWith('.md')) {
          const referencedFile = path.basename(href, '.md');
          if (!allFiles.includes(referencedFile)) {
            this.errors.push(`${componentName}: Broken link to "${href}"`);
          }
        }

        // Check anchor links
        if (href.startsWith('#')) {
          const anchor = href.substring(1);
          const expectedHeading = anchor.replace(/-/g, ' ');
          
          // Basic check if heading exists (case-insensitive)
          if (!content.toLowerCase().includes(expectedHeading.toLowerCase())) {
            this.warnings.push(`${componentName}: Potentially broken anchor link "${href}"`);
          }
        }
      }
    }

    console.log('✅ Link validation completed');
  }

  async validateExamples() {
    console.log('🧪 Validating code examples...');

    const docs = await this.getDocumentationFiles();

    for (const docFile of docs) {
      const content = await fs.readFile(docFile, 'utf8');
      const componentName = path.basename(docFile, '.md');

      // Extract TSX code blocks
      const tsxBlocks = content.match(/```tsx\n([\s\S]*?)\n```/g) || [];

      for (let i = 0; i < tsxBlocks.length; i++) {
        const block = tsxBlocks[i];
        const code = block.replace(/```tsx\n/, '').replace(/\n```$/, '');

        // Check for component usage
        if (!code.includes(`<${componentName}`) && componentName !== 'README') {
          this.warnings.push(`${componentName}: Example ${i + 1} doesn't show component usage`);
        }

        // Check for imports
        if (code.includes(`<${componentName}`) && !code.includes('import')) {
          this.warnings.push(`${componentName}: Example ${i + 1} missing import statement`);
        }

        // Check for complete JSX
        const openTags = (code.match(/</g) || []).length;
        const closeTags = (code.match(/>/g) || []).length;
        
        if (openTags !== closeTags) {
          this.errors.push(`${componentName}: Example ${i + 1} has malformed JSX`);
        }
      }
    }

    console.log('✅ Example validation completed');
  }

  async getComponentFiles() {
    const files = [];
    
    const scanDirectory = async (dir) => {
      const items = await fs.readdir(dir);
      
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = await fs.stat(fullPath);
        
        if (stat.isDirectory()) {
          await scanDirectory(fullPath);
        } else if (item.endsWith('.tsx') || item.endsWith('.ts')) {
          files.push(fullPath);
        }
      }
    };

    await scanDirectory(this.componentsDir);
    return files;
  }

  async getDocumentationFiles() {
    const files = [];
    
    const scanDirectory = async (dir) => {
      try {
        const items = await fs.readdir(dir);
        
        for (const item of items) {
          const fullPath = path.join(dir, item);
          const stat = await fs.stat(fullPath);
          
          if (stat.isDirectory()) {
            await scanDirectory(fullPath);
          } else if (item.endsWith('.md')) {
            files.push(fullPath);
          }
        }
      } catch (error) {
        // Directory might not exist yet
        console.log(`Warning: Documentation directory ${dir} not found`);
      }
    };

    await scanDirectory(this.docsDir);
    return files;
  }

  printReport() {
    console.log('\n📊 Documentation Validation Report\n');
    console.log('='.repeat(50));

    if (this.errors.length === 0 && this.warnings.length === 0) {
      console.log('✅ All documentation validation checks passed!\n');
      return;
    }

    if (this.errors.length > 0) {
      console.log('❌ ERRORS:');
      this.errors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error}`);
      });
      console.log('');
    }

    if (this.warnings.length > 0) {
      console.log('⚠️  WARNINGS:');
      this.warnings.forEach((warning, index) => {
        console.log(`  ${index + 1}. ${warning}`);
      });
      console.log('');
    }

    console.log('Summary:');
    console.log(`  Errors: ${this.errors.length}`);
    console.log(`  Warnings: ${this.warnings.length}`);
    console.log('');

    if (this.errors.length > 0) {
      console.log('❌ Documentation validation failed. Please fix the errors above.');
      process.exit(1);
    } else {
      console.log('✅ Documentation validation passed with warnings.');
    }
  }
}

// Run validation
const validator = new DocumentationValidator();
validator.validate().catch(console.error);