<template>
  <div class="image-wrapper">
    <img :src="src" :style="imageStyle" class="image" />
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{
  src: string;
  scale: number;
  rotation: number;
  flipX: boolean;
  flipY: boolean;
}>();

const imageStyle = computed(() => ({
  transform: `scale(${props.scale * (props.flipX ? -1 : 1)}, ${
    props.scale * (props.flipY ? -1 : 1)
  }) rotate(${props.rotation}deg)`,
  transition: "transform 0.3s ease",
  maxWidth: "90%",
  maxHeight: "90%",
  objectFit: "contain",
}));
</script>

<style scoped>
.image-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 80vh;
  overflow: hidden;
}
.image {
  user-select: none;
}
</style>
