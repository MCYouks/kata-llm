<template>
  <div>
    Stream
    <div>
      {{ answer }}
    </div>
    <div v-if="loading">Chargement...</div>
    <input style="width: 512px" v-model="question" placeholder="Ask a question here" />
    <button @click="getAnswer()">
      Get answer
    </button>
  </div>
</template>

<script setup lang="ts">
import { resolveStream } from "~/utils/chat-stream";
import { applyPatch } from 'fast-json-patch';

const question = ref("Quel est le concept de la relativité?")
const answer = ref({})
const loading = ref(false)

const getAnswer = async function () {
  try {
    loading.value = true;
    answer.value = {};

    /**
     * Note: we are using the native `fetch` API to handle readable streams.
     */
    const { body: stream } = await fetch("/api/generate-stream-response", { 
      method: "POST", 
      body: JSON.stringify({ question: question.value }) 
    });

    if (!stream) throw new Error("No stream returned!");

    let buffer = '';

    resolveStream(stream, {
      onChunk: (chunk) => {
        buffer += chunk;
        let start = buffer.indexOf('[');
        let end = buffer.lastIndexOf(']');

        if (start >= 0 && end >= 0) {
          const jsonStr = '[' + buffer.substring(start, end + 1).replace(/\]\s*\[/g, '],[') + ']';
          buffer = buffer.substring(end + 1);

          try {
            const patches = JSON.parse(jsonStr);
            patches.forEach((patch: any) => {
              console.log({ patch}, typeof patch)
              answer.value = applyPatch(answer.value, patch).newDocument;
            });
          } catch (error) {
            console.error('Failed to parse JSON:', error);
          }
        }
      },
    });
  } catch (error) {
  } finally {
    loading.value = false;
  }
}
</script>
