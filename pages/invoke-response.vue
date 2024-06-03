<template>
  <div>
    Invoke
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
    const response = await $fetch("/api/generate-invoke-response", { 
      method: "POST", 
      body: { question: question.value }
    });

    if (!response) throw new Error("No response returned!");

    answer.value = response
  } catch (error) {
  } finally {
    loading.value = false;
  }
}
</script>
