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
        const newDocument = resolveJSONPatch(answer.value, chunk)
        if (newDocument) answer.value = newDocument
      },
    });
  } catch (error) {
  } finally {
    loading.value = false;
  }
}
</script>
