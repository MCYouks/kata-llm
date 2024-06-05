import { applyPatch } from 'fast-json-patch';

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

/**
 * This function is used to handle and process incoming chunks of data from a server-side stream.
 * Each chunk is a JSON string representing an array of JSON patches. These patches are used to incrementally update a document.
 * The function first splits the chunk into individual patches. This is necessary because sometimes multiple patches can be sent together as a single chunk.
 * After splitting, each patch is applied to the document, and the updated document is returned.
 */
export const resolveJSONPatch = function<T extends object> (document:T, chunk: string) {
  let newDocument = document

  // Split the chunk by replacing '][' with '],[', and wrap into an array to get individual JSON arrays
  const splitChunks = '[' + chunk.replace(/\]\s*\[/g, '],[') + ']';

  try {
    // Parse the JSON string into an array of patches
    const patches = JSON.parse(splitChunks);

    // Apply each patch to the new document
    patches.forEach((patch: any) => {
      newDocument = applyPatch(newDocument, patch).newDocument;
    });

    return newDocument
  } catch (error) {
    console.error('Failed to parse JSON:', error, { splitChunks });
  }
}
