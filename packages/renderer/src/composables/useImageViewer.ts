import { reactive, ref } from "vue";

const MIN_SCALE = 0.25;
const MAX_SCALE = 8;

export function useImageViewer() {
  const scale = ref(1);
  const rotation = ref(0);
  const flipX = ref(false);
  const flipY = ref(false);
  const offset = reactive({ x: 0, y: 0 });

  const setScale = (value: number) => {
    scale.value = Math.min(MAX_SCALE, Math.max(MIN_SCALE, value));
    if (scale.value <= 1) {
      offset.x = 0;
      offset.y = 0;
    }
  };

  const setOffset = (x: number, y: number) => {
    offset.x = x;
    offset.y = y;
  };

  const resetView = () => {
    scale.value = 1;
    rotation.value = 0;
    flipX.value = false;
    flipY.value = false;
    offset.x = 0;
    offset.y = 0;
  };

  return {
    scale,
    rotation,
    flipX,
    flipY,
    offset,
    zoomIn: () => setScale(scale.value + 0.1),
    zoomOut: () => setScale(scale.value - 0.1),
    rotate: () => (rotation.value = (rotation.value + 90) % 360),
    toggleFlipX: () => (flipX.value = !flipX.value),
    toggleFlipY: () => (flipY.value = !flipY.value),
    setScale,
    setOffset,
    resetView,
  };
}
