import { ref } from "vue";

export function useImageViewer() {
  const scale = ref(1);
  const rotation = ref(0);
  const flipX = ref(false);
  const flipY = ref(false);

  return {
    scale,
    rotation,
    flipX,
    flipY,
    zoomIn: () => (scale.value += 0.1),
    zoomOut: () => (scale.value = Math.max(0.1, scale.value - 0.1)),
    rotate: () => (rotation.value = (rotation.value + 90) % 360),
    toggleFlipX: () => (flipX.value = !flipX.value),
    toggleFlipY: () => (flipY.value = !flipY.value),
  };
}
