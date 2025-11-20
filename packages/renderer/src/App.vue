<template>
  <Viewer />
</template>

<script setup lang="ts">
import { onMounted } from "vue";
import Viewer from "./views/Viewer.vue";
import { useSystemTheme } from "./composables/useSystemTheme";

const { init } = useSystemTheme();

onMounted(() => {
  void init();
});
</script>
