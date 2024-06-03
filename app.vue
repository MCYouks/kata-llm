<template>
  <div>
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

const question = ref("What is the concept of relativity?")
const answer = ref("")
const loading = ref(false)

const getAnswer = async function () {
  try {
    loading.value = true;
    answer.value = "";

    /**
     * Note: we are using the native `fetch` API to handle readable streams.
     */
    const { body: stream } = await fetch("/api/generate-stream-response", { 
      method: "POST", 
      body: JSON.stringify({ question: question.value }) 
    });

    if (!stream) throw new Error("No stream returned!");

    resolveStream(stream, {
      onChunk: (content) => {
        answer.value += content;
      },
    });
  } catch (error) {
  } finally {
    loading.value = false;
  }
}
</script>
