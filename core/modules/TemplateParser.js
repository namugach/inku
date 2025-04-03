import { RegexPatterns, createRegExp } from './RegexPatterns.js';

/**
 * 템플릿 파싱 및 렌더링을 담당하는 클래스
 */
export class TemplateParser {
  /**
   * @param {Object} [context={}] 초기 컨텍스트 객체
   */
  constructor(context = {}) {
    this.context = context;
    // 정규식 패턴 캐싱
    this.patterns = {
      forBlock: RegexPatterns.forBlock,
      ifBlock: RegexPatterns.ifBlock,
      variable: RegexPatterns.variable,
      include: RegexPatterns.include,
      contextDecl: RegexPatterns.contextDeclaration
    };
  }

  /**
   * 템플릿을 파싱하고 렌더링합니다.
   * @param {string} template 템플릿 문자열
   * @param {Object} [context={}] 추가 컨텍스트 객체
   * @returns {Promise<string>} 렌더링된 결과
   */
  async parse(template, context = {}) {
    this.context = { ...this.context, ...context };  // context 병합
    return await this.#resolveBlocks(template, this.context);
  }

  /**
   * 템플릿 블록을 해석합니다.
   * @private
   * @param {string} template 템플릿 문자열
   * @param {Object} context 컨텍스트 객체
   * @returns {Promise<string>} 해석된 결과
   */
  async #resolveBlocks(template, context) {
    const tokens = this.#tokenize(template);
    const output = await this.#processTokens(tokens, context);
    return output;
  }

  /**
   * 템플릿을 토큰으로 분리합니다.
   * @private
   * @param {string} template 템플릿 문자열
   * @returns {Array} 토큰 배열
   */
  #tokenize(template) {
    const regex = RegexPatterns.templateToken;
    const tokens = [];
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(template)) !== null) {
      if (match.index > lastIndex) {
        const text = template.slice(lastIndex, match.index);
        tokens.push({ type: 'text', value: text });
      }

      const token = match[1];
      if (token.startsWith('for(')) {
        // for 구문의 경우 match[2]가 있는지 확인 (반복 변수와 배열 표현식)
        const forParamsMatch = /for\s*\((.*?)\)/.exec(token);
        const forParams = forParamsMatch ? forParamsMatch[1] : '';
        tokens.push({ type: 'for_open', value: forParams });
      } else if (token === 'endfor') {
        tokens.push({ type: 'for_close' });
      } else if (token.startsWith('!include')) {
        // include는 다른 방식으로 처리하므로 text로 유지
        tokens.push({ type: 'text', value: match[0] });
      } else if (token.startsWith('?')) {
        // 변수 토큰
        tokens.push({ type: 'variable', value: token.slice(1).trim() });
      }

      lastIndex = regex.lastIndex;
    }

    if (lastIndex < template.length) {
      tokens.push({ type: 'text', value: template.slice(lastIndex) });
    }

    return tokens;
  }

  /**
   * 토큰을 처리합니다.
   * @private
   * @param {Array} tokens 토큰 배열
   * @param {Object} context 컨텍스트 객체
   * @returns {Promise<string>} 처리된 결과
   */
  async #processTokens(tokens, context) {
    const stack = [];
    const output = [];
    let current = output;

    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];

      if (token.type === 'for_open') {
        // 구문 분석: "변수 in 표현식" 형태로 분리
        const forExpression = token.value;
        const parts = forExpression.split(/\s+in\s+/);
        
        if (parts.length !== 2) {
          console.warn('❌ for: 잘못된 형식입니다. "변수 in 배열"이어야 합니다.', forExpression);
          continue;
        }
        
        const varName = parts[0].trim();
        const iterableExpr = parts[1].trim();
        
        const forBlock = { type: 'for', varName, iterableExpr, children: [] };
        current.push(forBlock);
        stack.push(current);
        current = forBlock.children;
      } else if (token.type === 'for_close') {
        if (stack.length > 0) {
          current = stack.pop();
        } else {
          console.warn('❌ endfor 태그에 해당하는 for 블록이 없습니다.');
        }
      } else {
        current.push(token);
      }
    }

    return await this.#renderTokens(output, context);
  }

  /**
   * 토큰을 렌더링합니다.
   * @private
   * @param {Array} tokens 토큰 배열
   * @param {Object} context 컨텍스트 객체
   * @returns {Promise<string>} 렌더링된 결과
   */
  async #renderTokens(tokens, context) {
    let result = '';

    for (const token of tokens) {
      if (token.type === 'text') {
        result += token.value;
      } else if (token.type === 'variable') {
        const value = this.#evaluate(token.value, context);
        result += value ?? '';
      } else if (token.type === 'for') {
        const iterable = this.#evaluate(token.iterableExpr, context);

        if (Array.isArray(iterable)) {
          for (const item of iterable) {
            const loopCtx = { ...context, [token.varName]: item };
            result += await this.#renderTokens(token.children, loopCtx);
          }
        } else if (typeof iterable === 'number') {
          for (let i = 0; i < iterable; i++) {
            const loopCtx = { ...context, [token.varName]: i };
            result += await this.#renderTokens(token.children, loopCtx);
          }
        }
      }
    }

    return result;
  }

  /**
   * 표현식을 평가합니다.
   * @private
   * @param {string} expr 평가할 표현식
   * @param {Object} context 컨텍스트 객체
   * @returns {*} 평가 결과
   */
  #evaluate(expr, context) {
    try {
      // 보안을 위해 Function 생성자 대신 안전한 평가 방법 사용
      // 실제 구현에서는 더 안전한 방법으로 대체해야 함
      const keys = Object.keys(context);
      const values = Object.values(context);
      const fn = new Function(...keys, `return (${expr})`);
      return fn(...values);
    } catch (e) {
      console.warn('❌ 표현식 평가 실패:', expr, e);
      return undefined;
    }
  }

  /**
   * if 문을 처리합니다.
   * @param {string} html HTML 문자열
   * @param {Object} context 컨텍스트 객체
   * @returns {string} 처리된 HTML
   */
  resolveIfStatements(html, context) {
    return html.replace(this.patterns.ifBlock, (_, condition, content) => {
      try {
        const fn = new Function(...Object.keys(context), `return (${condition});`);
        const result = fn(...Object.values(context));
        return result ? content : '';
      } catch (e) {
        console.warn('❌ if 처리 실패:', e);
        return '';
      }
    });
  }

  /**
   * for 문을 처리합니다.
   * @param {string} html HTML 문자열
   * @param {Object} context 컨텍스트 객체
   * @returns {string} 처리된 HTML
   */
  resolveForStatements(html, context) {
    return html.replace(this.patterns.forBlock, (match, loopExpr, loopContent) => {
      try {
        // 예: "item in items" 형태 분리
        const parts = loopExpr.split(/\s+in\s+/);
        if (parts.length !== 2) {
          console.warn('❌ for: 잘못된 형식입니다. "변수 in 배열"이어야 합니다.', loopExpr);
          return '';
        }

        const loopVarName = parts[0].trim();
        const iterableExpr = parts[1].trim();

        // 1. context로 표현식 평가
        const keys = Object.keys(context);
        const values = Object.values(context);
        const fn = new Function(...keys, `return (${iterableExpr})`);
        let result = fn(...values);
  
        // 2. 만약 문자열인데 배열처럼 생겼으면 강제로 파싱
        if (typeof result === 'string' && RegexPatterns.arrayDetection.test(result.trim())) {
          try {
            result = new Function(`return (${result})`)();
          } catch {
            console.warn('❌ 문자열 평가 실패:', result);
          }
        }
  
        // 3. 반복 가능한 배열로 전환
        let iterable = [];
  
        if (Array.isArray(result)) {
          iterable = result;
        } else if (typeof result === 'number') {
          iterable = Array.from({ length: result }, (_, i) => i);
        } else {
          console.warn('❌ for: 반복 불가능한 값입니다.', result);
          return '';
        }
  
        // 4. 보간 처리
        const output = [];
  
        for (const val of iterable) {
          const replaced = loopContent.replace(
            createRegExp(`{{\\s*\\?\\s*${loopVarName}\\s*}}`, 'g'),
            val
          );
          output.push(replaced);
        }
  
        return output.join('');
      } catch (err) {
        console.warn('❌ for 처리 중 오류:', err);
        return '';
      }
    });
  }

  /**
   * 변수 선언을 파싱합니다.
   * @param {string} html HTML 문자열
   * @returns {Object} 파싱된 컨텍스트 객체
   */
  parseContextDeclarations(html) {
    const context = {};
    let match;
  
    while ((match = this.patterns.contextDecl.exec(html)) !== null) {
      const [_, key, rawValue] = match;
      
      if (key && rawValue !== undefined) {
        try {
          // 값이 JavaScript 표현식일 경우 평가
          const value = new Function(`return (${rawValue})`)();
          context[key] = value;
        } catch {
          // 평가할 수 없으면 단순 문자열로 취급
          context[key] = rawValue.replace(RegexPatterns.quoteStrip, '');
        }
      }
    }
  
    return context;
  }

  /**
   * include 지시문 파싱
   * @param {string} argsString 
   * @returns {Object} 파싱된 인자 객체
   */
  parseInclude(argsString) {
    const tokens = this.#splitArgs(argsString);
    const filePath = tokens[0].replace(RegexPatterns.quoteStrip, '');
    const args = {};
    
    if (tokens.length > 1) {
      for (let i = 1; i < tokens.length; i++) {
        const argPair = tokens[i].split('=');
        if (argPair.length !== 2) continue;
        
        const key = argPair[0].trim();
        const rawVal = argPair[1].trim();
        
        try {
          // 진짜로 평가해서 배열/숫자/객체로 바꿈
          args[key] = new Function(`return (${rawVal})`)();
        } catch {
          // 평가 실패하면 그냥 문자열로
          args[key.trim()] = rawVal.replace(RegexPatterns.quoteStrip, '');
        }
      }
    }
    
    return { filePath, args };
  }
  
  /**
   * 인자 문자열을 분리합니다.
   * @private
   * @param {string} argsString 인자 문자열
   * @returns {string[]} 분리된 인자 배열
   */
  #splitArgs(argsString) {
    const result = [];
    let current = '';
    let inQuote = false;
    let quoteChar = '';
    
    for (let i = 0; i < argsString.length; i++) {
      const char = argsString[i];
      
      if ((char === '"' || char === "'") && !inQuote) {
        inQuote = true;
        quoteChar = char;
        current += char;
      } else if (char === quoteChar && inQuote) {
        inQuote = false;
        current += char;
      } else if (char === ',' && !inQuote) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    if (current) result.push(current.trim());
    return result;
  }
} 