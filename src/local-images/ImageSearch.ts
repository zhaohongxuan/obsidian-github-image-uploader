import { App, TFile } from 'obsidian';

export interface ReferenceMatch {
  file: TFile;
  matchCount: number;
}

export interface ReplaceResult {
  success: number;
  failed: number;
  failedFiles: Array<{ file: TFile; error: string }>;
}

/**
 * Utility class for searching image references across vault markdown files
 * and replacing local image paths with remote URLs.
 */
export class ImageSearch {
  constructor(private app: App) {}

  /**
   * Find all markdown files that reference a local image path
   */
  async findReferencingNotes(localPath: string): Promise<ReferenceMatch[]> {
    const markdownFiles = this.app.vault.getMarkdownFiles();

    // Generate search targets for various path formats
    const targets = this.generateSearchTargets(localPath);

    const matches = await Promise.all(
      markdownFiles.map(async (file) => {
        const content = await this.app.vault.cachedRead(file);
        const matchCount = this.countReferenceMatches(content, targets);

        if (matchCount === 0) {
          return null;
        }

        return { file, matchCount };
      })
    );

    return matches
      .filter((item): item is ReferenceMatch => item !== null)
      .sort((a, b) => b.matchCount - a.matchCount || a.file.path.localeCompare(b.file.path, 'zh-CN'));
  }

  /**
   * Replace all occurrences of a local image path with a GitHub URL in the specified files
   */
  async replaceLocalReferences(
    localPath: string,
    githubUrl: string,
    files: TFile[]
  ): Promise<ReplaceResult> {
    const result: ReplaceResult = { success: 0, failed: 0, failedFiles: [] };
    const targets = this.generateSearchTargets(localPath);

    for (const file of files) {
      try {
        let content = await this.app.vault.read(file);
        let modified = false;

        for (const target of targets) {
          if (!target) continue;

          // Try exact match first
          if (content.includes(target)) {
            content = content.split(target).join(githubUrl);
            modified = true;
            continue;
          }

          // Try case-insensitive match
          const lowerContent = content.toLowerCase();
          const lowerTarget = target.toLowerCase();
          if (lowerContent.includes(lowerTarget)) {
            // Replace all case-insensitive matches while preserving original case
            const regex = new RegExp(this.escapeRegExp(target), 'gi');
            content = content.replace(regex, githubUrl);
            modified = true;
          }
        }

        if (modified) {
          await this.app.vault.modify(file, content);
          result.success++;
        }
      } catch (error) {
        result.failed++;
        result.failedFiles.push({
          file,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return result;
  }

  private escapeRegExp(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Generate various path formats to search for
   */
  private generateSearchTargets(localPath: string): string[] {
    const targets = new Set<string>();

    // Direct path
    targets.add(localPath);

    // With ./ prefix
    if (!localPath.startsWith('./')) {
      targets.add('./' + localPath);
    }

    // URL encoded variants
    targets.add(encodeURI(localPath));
    targets.add(encodeURIComponent(localPath));

    // With ./ prefix and URL encoded
    if (!localPath.startsWith('./')) {
      targets.add('./' + encodeURI(localPath));
      targets.add('./' + encodeURIComponent(localPath));
    }

    // Also search by just the filename (in case markdown uses relative path from subfolder)
    const filename = localPath.split('/').pop() || localPath;
    targets.add(filename);

    // Remove empty/null values
    return Array.from(targets).filter(Boolean);
  }

  /**
   * Count occurrences of any target string in content (case-insensitive)
   */
  private countReferenceMatches(content: string, targets: string[]): number {
    return targets.reduce((maxCount, target) => {
      if (!target) {
        return maxCount;
      }

      // Try exact match first
      let count = this.countExactMatches(content, target);
      if (count > 0) {
        return Math.max(maxCount, count);
      }

      // Try case-insensitive match
      const lowerContent = content.toLowerCase();
      const lowerTarget = target.toLowerCase();
      count = this.countExactMatches(lowerContent, lowerTarget);

      return Math.max(maxCount, count);
    }, 0);
  }

  private countExactMatches(content: string, target: string): number {
    let count = 0;
    let startIndex = 0;

    while (startIndex < content.length) {
      const matchIndex = content.indexOf(target, startIndex);
      if (matchIndex === -1) {
        break;
      }

      count++;
      startIndex = matchIndex + target.length;
    }

    return count;
  }
}
