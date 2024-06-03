type ResolveStreamParams = {
  onStart?: () => void;
  onChunk?: (data: string) => void;
  onDone?: () => void;
  onError?: (error: any) => void;
};

/**
 * Resolves a ReadableStream, reading data chunks.
 *
 * Inspired by:
 * - https://github.com/langchain-ai/langchain-cloudflare-nuxt-template/blob/main/server/api/chat.post.ts
 * - https://markus.oberlehner.net/blog/building-a-chatgpt-client-with-nuxt-leveraging-response-streaming-for-a-chat-like-experience/
 *
 * @param {ReadableStream} stream - Stream to resolve.
 * @param {ResolveStreamParams} params - Callbacks for stream resolution stages.
 */
export const resolveStream = async function (stream: ReadableStream, params?: ResolveStreamParams) {
  const reader = stream.pipeThrough(new TextDecoderStream()).getReader();

  const { onStart = () => {}, onDone = () => {}, onChunk = () => {}, onError = () => {} } = params ?? {};

  try {
    onStart();

    while (true) {
      const result = await reader.read();
      if (result.done) break;

      const chunk = result.value;

      onChunk(chunk);
    }

    onDone();
  } catch (error) {
    onError(error);
  }
};
