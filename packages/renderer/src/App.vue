<template>
  <Viewer />
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount } from "vue";
import Viewer from "./views/Viewer.vue";
import { useSystemTheme } from "./composables/useSystemTheme";

const { init, dispose } = useSystemTheme();

onMounted(() => {
  void init();
});

onBeforeUnmount(() => {
  dispose();
});
</script>
