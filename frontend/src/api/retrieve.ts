import { post, postRaw } from './client';

// ── 类型定义 ──────────────────────────────────────────────────────────────────

export interface RetrieveResult {
  words: string[];
  analysis?: Record<string, unknown>;
  wordDetails?: Record<string, unknown>;
}

export interface ValidateResult {
  valid: boolean;
  lemma: string;
  in_vocab: boolean;
  pos?: string;
  chinese_meaning?: string;
  error?: string;
}

// ── 接口 ──────────────────────────────────────────────────────────────────────

/** 快速模式：FAISS 检索相似词 */
export async function retrieveSimilarWords(
  query: string,
  bookKey: string = 'ielts',
  includeAnalysis: boolean = false,
): Promise<RetrieveResult> {
  const data = await post<{ success: boolean; words?: string[]; analysis?: Record<string, unknown>; word_details?: Record<string, unknown>; error?: string }>(
    '/retrieve',
    { query, book_key: bookKey, k: 56, include_analysis: includeAnalysis },
  );

  if (!data.success) {
    throw new Error(data.error || '检索失败');
  }

  return {
    words: data.words || [],
    analysis: data.analysis,
    wordDetails: data.word_details,
  };
}

/** AI 模式：SSE 流式检索，yield 每个事件对象 */
export async function* retrieveWithSSE(query: string, bookKey: string) {
  const response = await postRaw('/retrieve-stream', { query, book_key: bookKey, k: 56 });

  if (!response.body) {
    throw new Error('SSE 响应体为空');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buf = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const parts = buf.split('\n\n');
    buf = parts.pop()!;
    for (const part of parts) {
      if (part.startsWith('data: ')) {
        try {
          yield JSON.parse(part.slice(6));
        } catch {
          /* 跳过格式异常事件 */
        }
      }
    }
  }
}

/** 验证单词是否合法、是否在词书中 */
export async function validateWord(word: string): Promise<ValidateResult> {
  return post<ValidateResult>('/validate-word', { word });
}
