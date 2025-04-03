/**
 * 인쿠 프레임워크에서 사용되는 정규식 패턴 모음
 */

export const RegexPatterns = {
  // Router.js
  hashStrip: /^#\//,

  // Core.js
  comments: /<!--\s*{{.+}}\s*-->/g,
  allComments: /<!--[\s\S]*?-->/g,
  styleLink: /<link\s+rel=["']stylesheet["']\s+href=["'](.+?)["'].*?>/gi,
  include: /{{\s*!include\s*\(\s*((?:"[^"]*"|'[^']*'|[^)])*)\s*\)\s*}}/g,
  variable: /\{\{\s*\?([^}]+)\}\}/g,
  contextDeclaration: /\{\{\s*\$(\w+)\s*=\s*(.*?)\s*\}\}/g,

  // TemplateParser.js
  forBlock: /{{\s*for\s*\((.*?)\)\s*}}([\s\S]*?){{\s*endfor\s*}}/g,
  ifBlock: /{{\s*if\s*\((.*?)\)\s*}}([\s\S]*?){{\s*endif\s*}}/g,
  templateToken: /{{\s*(for\s*\((.*?)\)|endfor|!include\s*\(.*?\)|\?\s*[^}]*?)\s*}}/g,
  arrayDetection: /^\[.*\]$/,
  quoteStrip: /^['"]|['"]$/g,
};

/**
 * 정규식 패턴에 대한 동적 객체 생성 함수
 * 
 * @param {string} pattern - 정규식 패턴 문자열
 * @param {string} flags - 정규식 플래그 (예: 'g', 'gi' 등)
 * @returns {RegExp} - 생성된 RegExp 객체
 */
export function createRegExp(pattern, flags) {
  return new RegExp(pattern, flags);
} 