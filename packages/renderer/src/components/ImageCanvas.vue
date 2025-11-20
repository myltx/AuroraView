<template>
  <div class="image-wrapper">
    <img v-if="src" :src="src" :style="imageStyle" class="image" />
    <div v-else class="image-placeholder">请选择图片或目录</div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

const props = withDefaults(
  defineProps<{
    src?: string | null;
    scale: number;
    rotation: number;
    flipX: boolean;
    flipY: boolean;
    offsetX?: number;
    offsetY?: number;
    isInteracting?: boolean;
  }>(),
  {
    offsetX: 0,
    offsetY: 0,
    isInteracting: false,
  }
);

const imageStyle = computed(() => ({
  transform: `translate3d(${props.offsetX}px, ${props.offsetY}px, 0) rotate(${
    props.rotation
  }deg) scale(${props.scale * (props.flipX ? -1 : 1)}, ${
    props.scale * (props.flipY ? -1 : 1)
  })`,
  transition: props.isInteracting ? "none" : "transform 0.25s ease",
  maxWidth: "100%",
  maxHeight: "100%",
  objectFit: "contain" as const,
  transformOrigin: "center center",
}));
</script>

<style scoped>
.image-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  border-radius: 24px;
  background: radial-gradient(
    circle at top,
    rgba(255, 255, 255, 0.08),
    transparent 60%
  );
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: inset 0 0 60px rgba(0, 0, 0, 0.35);
  overflow: hidden;
  position: relative;
}
.image {
  user-select: none;
  width: 100%;
  height: 100%;
  object-fit: contain;
  will-change: transform;
}
.image-placeholder {
  color: #888;
  font-size: 18px;
  letter-spacing: 2px;
  text-align: center;
  padding: 0 24px;
}
</style>
