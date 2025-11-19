<template>
  <div class="viewer">
    <ImageCanvas
      :src="imageList[currentIndex]"
      :scale="scale"
      :rotation="rotation"
      :flip-x="flipX"
      :flip-y="flipY" />

    <div class="controls">
      <button @click="zoomOut">➖</button>
      <button @click="zoomIn">➕</button>
      <button @click="rotate">🔄</button>
      <button @click="toggleFlipX">↔️</button>
      <button @click="toggleFlipY">↕️</button>
      <button @click="toggleFullscreen">⛶</button>
      <button @click="toggleSlideshow">{{ playing ? "⏸️" : "▶️" }}</button>
      <!-- 添加在已有控件区域 -->
      <button @click="prevImage">⬅️</button>
      <button @click="nextImage">➡️</button>
      <button @click="loadImages">📂 选择图片</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import ImageCanvas from "../components/ImageCanvas.vue";
import { useImageViewer } from "../composables/useImageViewer";
import { useSlideshow } from "../composables/useSlideshow";
import { ref, watch } from "vue";
import VueSvg from "../assets/vue.svg";
import OneImg from "../assets/1231.png";
const imageList = [VueSvg, OneImg];

const currentIndex = ref(0);
const {
  scale,
  rotation,
  flipX,
  flipY,
  zoomIn,
  zoomOut,
  rotate,
  toggleFlipX,
  toggleFlipY,
} = useImageViewer();

const { playing, start, stop } = useSlideshow(imageList.length);
watch(playing, (val) =>
  val
    ? start(
        () => (currentIndex.value = (currentIndex.value + 1) % imageList.length)
      )
    : stop()
);

const toggleSlideshow = () => (playing.value = !playing.value);
const toggleFullscreen = () => window.electron?.toggleFullscreen();
const prevImage = () => {
  currentIndex.value =
    (currentIndex.value - 1 + imageList.length) % imageList.length;
};
const nextImage = () => {
  currentIndex.value = (currentIndex.value + 1) % imageList.length;
};
const loadImages = async () => {
  const filePaths = await window.electron?.selectImages();
  if (!filePaths || filePaths.length === 0) return;

  imageList.value = filePaths;
  currentIndex.value = 0;
};
</script>

<style scoped>
.viewer {
  height: 100vh;
  background: #1e1e1e;
  color: white;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.controls {
  margin-top: 12px;
  display: flex;
  gap: 10px;
}
button {
  font-size: 18px;
  padding: 6px 10px;
  background: #333;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}
</style>
