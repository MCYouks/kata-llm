<template>
  <div>
    Stream
    <div style="white-space: break-spaces;">
      {{ answer }}
    </div>
    <div v-if="loading">Chargement...</div>
    <input style="width: 512px" v-model="ingredients" placeholder="List ingredients here" />
    <button @click="getAnswer()">
      Get answer
    </button>
  </div>
</template>

<script setup lang="ts">
import { resolveStream } from "~/utils/chat-stream";
import { applyPatch } from 'fast-json-patch';

const ingredients = ref("Courgettes, aubergines, tomates")
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
      body: JSON.stringify({ ingredients: ingredients.value }) 
    });

    if (!stream) throw new Error("No stream returned!");

    resolveStream(stream, {
      onChunk: (chunk) => {
        // Split the chunk by replacing '][' with '],[', and wrap into an array to get individual JSON arrays
        const splitChunks = '[' + chunk.replace(/\]\s*\[/g, '],[') + ']';

        try {
          // Parse the JSON string into an array of patches
          const patches = JSON.parse(splitChunks);

          // Apply each patch to the answer
          patches.forEach((patch: any) => {
            answer.value = applyPatch(answer.value, patch).newDocument;
          });
        } catch (error) {
          console.error('Failed to parse JSON:', error, { splitChunks });
        }
      },
    });
  } catch (error) {
  } finally {
    loading.value = false;
  }
}
</script>
