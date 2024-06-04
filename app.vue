<template>
  <div>
    <div>
      <NuxtLink class="tab-link" to="/invoke-response">Invoke response</NuxtLink> |
      <NuxtLink class="tab-link" to="/stream-response">Stream response</NuxtLink>
    </div>
    <NuxtPage />
  </div>
</template>

<script setup lang="ts">
</script>

<style scoped lang="scss">
.tab-link {
  color: darkcyan;

  &.router-link-active {
    color: blue
  }
}
</style>
