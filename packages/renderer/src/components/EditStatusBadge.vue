<template>
  <div
    v-if="status !== 'none'"
    class="edit-badge"
    :class="{
      'edit-badge--edited': status === 'edited',
      'edit-badge--unedited': status === 'unedited',
    }"
    :title="status === 'edited' ? '已修图' : '未修原始文件'">
    <svg
      v-if="status === 'edited'"
      viewBox="0 0 24 24"
      aria-hidden="true"
      class="edit-badge__icon">
      <!-- check mark -->
      <path d="M5 13l4 4 10-10" />
    </svg>
    <svg
      v-else
      viewBox="0 0 24 24"
      aria-hidden="true"
      class="edit-badge__icon">
      <!-- pencil icon -->
      <path d="M5 19h14M6 5h4l9 9-4 4-9-9z" />
    </svg>
    <span class="edit-badge__label">
      {{ status === "edited" ? "已修" : "未修" }}
    </span>
  </div>
</template>

<script setup lang="ts">
interface Props {
  status: "edited" | "unedited" | "none";
}

defineProps<Props>();
</script>

<style scoped>
.edit-badge {
  position: absolute;
  top: 6px;
  right: 6px;
  padding: 2px 6px;
  border-radius: 999px;
  font-size: 11px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  backdrop-filter: blur(10px);
}

.edit-badge__icon {
  width: 12px;
  height: 12px;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.edit-badge--edited {
  background: rgba(16, 185, 129, 0.92);
  color: #ecfdf5;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.5);
}

.edit-badge--edited .edit-badge__icon {
  stroke: currentColor;
  fill: none;
}

.edit-badge--unedited {
  background: rgba(15, 23, 42, 0.82);
  color: rgba(226, 232, 240, 0.9);
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.4);
}

.edit-badge--unedited .edit-badge__icon {
  stroke: currentColor;
  fill: none;
  opacity: 0.85;
}

.edit-badge__label {
  line-height: 1;
}
</style>

