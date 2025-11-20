<template>
  <div class="viewer">
    <header class="viewer-unified-toolbar">
      <div class="toolbar-section toolbar-section--left">
        <button
          class="toolbar-icon-btn"
          title="打开目录"
          @click="openDirectoryPicker">
          📂
        </button>
        <button
          class="toolbar-icon-btn"
          title="刷新收藏与系统目录"
          @click="bootstrapSidebar">
          🔄
        </button>
        <button
          class="toolbar-icon-btn"
          :disabled="!canAddFavorite"
          title="将当前目录加入收藏"
          @click="addCurrentToFavorites">
          ⭐
        </button>
        <span class="toolbar-divider"></span>
        <div class="toolbar-form">
          <label class="toolbar-label">缩略图尺寸</label>
          <input
            class="toolbar-slider"
            type="range"
            min="80"
            max="220"
            step="10"
            :disabled="!hasImages"
            v-model.number="thumbnailSize" />
        </div>
        <div class="toolbar-form">
          <label class="toolbar-label">排序</label>
          <select
            class="toolbar-select"
            v-model="sortMode"
            :disabled="!hasImages">
            <option value="name-asc">名称 A→Z</option>
            <option value="name-desc">名称 Z→A</option>
            <option value="modified-desc">最近修改</option>
            <option value="size-desc">文件大小</option>
          </select>
        </div>
      </div>
      <div class="toolbar-section toolbar-section--center">
        <label class="toolbar-label">搜索</label>
        <input
          class="toolbar-search"
          v-model="searchKeyword"
          type="text"
          placeholder="输入文件名"
          :disabled="!hasImages" />
      </div>
      <div class="toolbar-section toolbar-section--right">
        <span class="toolbar-count">
          {{ hasImages ? `共 ${galleryCount} 张` : "未加载目录" }}
        </span>
        <div v-if="hasSelection" class="toolbar-selection">
          <span class="toolbar-count toolbar-count--selected">
            已选 {{ selectedCount }} 张
          </span>
          <div class="toolbar-action-buttons">
            <button
              class="viewer-toolbar__icon-btn has-tooltip"
              :disabled="!hasSelection"
              @click="copySelectedPaths"
              title="复制路径"
              data-tooltip="复制路径 (⌘C)">
              ⧉
            </button>
            <button
              class="viewer-toolbar__icon-btn has-tooltip"
              :disabled="selectedCount !== 1"
              @click="revealSelected"
              title="在 Finder 中显示"
              data-tooltip="在 Finder 中显示">
              🔍
            </button>
            <button
              class="viewer-toolbar__icon-btn has-tooltip"
              :disabled="selectedCount !== 1"
              @click="renameSelected"
              title="重命名"
              data-tooltip="重命名">
              📝
            </button>
            <button
              class="viewer-toolbar__icon-btn has-tooltip"
              :disabled="!hasSelection"
              @click="copySelectedToDirectory"
              title="复制到其他目录 (⌘⇧C)"
              data-tooltip="复制到目录 (⌘⇧C)">
              📂
            </button>
            <button
              class="viewer-toolbar__icon-btn has-tooltip"
              :disabled="!hasSelection"
              @click="moveSelectedToDirectory"
              title="移动到其他目录 (⌘⇧M)"
              data-tooltip="移动到目录 (⌘⇧M)">
              📦
            </button>
            <button
              class="viewer-toolbar__icon-btn has-tooltip"
              :disabled="!hasSelection"
              @click="exportSelected"
              title="导出到目录"
              data-tooltip="导出到目录">
              📤
            </button>
            <button
              class="viewer-toolbar__icon-btn has-tooltip"
              :disabled="!hasSelection"
              @click="deleteSelected"
              title="删除（移动到废纸篓）"
              data-tooltip="删除 (Delete)">
              🗑️
            </button>
          </div>
        </div>
      </div>
    </header>

    <div class="viewer-body">
      <aside class="viewer-sidebar">
      <div class="viewer-sidebar__card">
        <div class="sidebar-card__title">
          <span>当前目录</span>
          <p>当前所选路径</p>
        </div>
        <div class="viewer-sidebar__current">
          <p class="viewer-sidebar__label">路径</p>
          <p class="viewer-sidebar__path">{{ currentDirectoryLabel }}</p>
        </div>
      </div>

      <div class="viewer-sidebar__card viewer-sidebar__card--tree">
        <div class="sidebar-card__header">
          <div class="sidebar-card__title">
            <span>收藏夹</span>
            <p>常用目录</p>
          </div>
          <button
            class="viewer-sidebar__icon-btn"
            :disabled="!canAddFavorite"
            @click="addCurrentToFavorites"
            title="将当前目录添加到收藏">
            ＋
          </button>
        </div>
        <div v-if="flattenedFavorites.length" class="directory-tree">
          <div
            v-for="node in flattenedFavorites"
            :key="node.path"
            class="directory-tree__row"
            :style="{ paddingLeft: `${node.depth * 16 + 8}px` }">
            <button
              v-if="node.isDirectory"
              class="directory-tree__toggle"
              @click.stop="toggleNode(node)">
              {{ node.isExpanded ? "▾" : "▸" }}
            </button>
            <button
              class="directory-tree__main"
              :class="{
                'is-active': node.path === activeNodePath,
                'is-drop-target': dragOverPath === node.path,
              }"
              @click="selectNode(node)"
              @dragenter.prevent="handleNodeDragEnter(node, $event)"
              @dragover.prevent="handleNodeDragOver(node, $event)"
              @dragleave="handleNodeDragLeave(node, $event)"
              @drop.prevent="handleNodeDrop(node, $event)">
              <span class="directory-tree__icon">⭐</span>
              <span class="directory-tree__name">{{ node.name }}</span>
            </button>
            <button
              v-if="node.favoriteId"
              class="directory-tree__action"
              title="移除收藏"
              @click.stop="removeFavorite(node.favoriteId)">
              ✕
            </button>
          </div>
        </div>
        <p v-else class="viewer-sidebar__empty">暂无收藏，点击上方按钮添加</p>
      </div>

      <div class="viewer-sidebar__card viewer-sidebar__card--tree">
        <div class="sidebar-card__header">
          <div class="sidebar-card__title">
            <span>系统目录</span>
            <p>常用工作区</p>
          </div>
        </div>
        <div v-if="flattenedSystem.length" class="directory-tree">
          <div
            v-for="node in flattenedSystem"
            :key="node.path"
            class="directory-tree__row"
            :style="{ paddingLeft: `${node.depth * 16 + 8}px` }">
            <button
              v-if="node.isDirectory"
              class="directory-tree__toggle"
              @click.stop="toggleNode(node)">
              {{ node.isExpanded ? "▾" : "▸" }}
            </button>
            <button
              class="directory-tree__main"
              :class="{
                'is-active': node.path === activeNodePath,
                'is-drop-target': dragOverPath === node.path,
              }"
              @click="selectNode(node)"
              @dragenter.prevent="handleNodeDragEnter(node, $event)"
              @dragover.prevent="handleNodeDragOver(node, $event)"
              @dragleave="handleNodeDragLeave(node, $event)"
              @drop.prevent="handleNodeDrop(node, $event)">
              <span class="directory-tree__icon">📁</span>
              <span class="directory-tree__name">{{ node.name }}</span>
            </button>
          </div>
        </div>
        <p v-else class="viewer-sidebar__empty">未发现系统目录</p>
      </div>
  </aside>

    <div class="viewer-main">
    <section class="viewer-workspace">
      <div
        v-if="hasImages"
        class="viewer-gallery"
        :style="galleryStyle"
        ref="galleryRef">
        <div
          class="viewer-gallery__spacer"
          :style="{ height: `${topSpacer}px` }"></div>
        <div class="viewer-gallery__grid">
          <button
            v-for="(item, offset) in virtualItems"
            :key="item.path"
            class="viewer-gallery__item"
            :class="{
              'is-active': startIndex + offset === currentIndex,
              'is-selected': selectedIndexes.has(startIndex + offset),
            }"
            draggable="true"
            @click="handleGallerySelection($event, startIndex + offset)"
            @dblclick.prevent="openLightbox(startIndex + offset)"
            @dragstart="handleGalleryDragStart($event, startIndex + offset)"
            @dragend="handleGalleryDragEnd">
            <div
              class="viewer-gallery__asset"
              :class="{ 'is-ready': isThumbnailReady(item.resource) }">
              <img :src="getThumbnailSrc(item.resource)" :alt="item.name" loading="lazy" />
            </div>
            <p class="viewer-gallery__caption" :title="item.name">
              {{ item.name }}
            </p>
          </button>
        </div>
        <div
          class="viewer-gallery__spacer"
          :style="{ height: `${bottomSpacer}px` }"></div>
      </div>
      <p v-else class="viewer-gallery__placeholder">
        请选择目录以加载缩略图
      </p>
    </section>
  </div>

  </div>

    <div v-if="lightboxVisible" class="viewer-lightbox">
      <div class="viewer-lightbox__backdrop" @click="closeLightbox"></div>
      <div class="viewer-lightbox__content">
        <button class="viewer-lightbox__close" @click="closeLightbox">
          ✕
        </button>
        <div class="viewer-lightbox__meta">
          <span>{{ statusText }}</span>
          <span v-if="currentFileName">{{ currentFileName }}</span>
          <span v-if="currentMetadata" class="viewer-lightbox__meta-details">
            {{ formatFileSize(currentMetadata.size) }} ·
            {{ formatDate(currentMetadata.modifiedAt) }}
          </span>
        </div>
        <div
          ref="lightboxCanvasRef"
          class="viewer-lightbox__canvas viewer-lightbox__canvas-wrapper"
          :class="[
            `viewer-lightbox__canvas--${lightboxDirection}`,
            {
              'viewer-lightbox__canvas--pannable': canPan,
              'is-grabbing': isPanning,
            },
          ]"
          @wheel.prevent="handleLightboxWheel"
          @pointerdown="handlePointerDown"
          @pointermove="handlePointerMove"
          @pointerup="handlePointerUp"
          @pointerleave="handlePointerLeave"
          @pointercancel="handlePointerCancel"
          @dblclick="resetLightboxView">
          <ImageCanvas
            :src="currentImage"
            :scale="scale"
            :rotation="rotation"
            :flip-x="flipX"
            :flip-y="flipY"
            :offset-x="offset.x"
            :offset-y="offset.y"
            :is-interacting="isPanning" />
        </div>
        <div class="viewer-lightbox__controls">
          <button
            class="control-button"
            @click="toggleSlideshow"
            :disabled="!canPlaySlideshow">
            <span class="control-button__icon">
              {{ playing ? "⏸️" : "▶️" }}
            </span>
          </button>
          <button class="control-button" @click="prevImage" :disabled="galleryItems.length < 2">
            <span class="control-button__icon">⬅️</span>
          </button>
          <button class="control-button" @click="nextImage" :disabled="galleryItems.length < 2">
            <span class="control-button__icon">➡️</span>
          </button>
          <button class="control-button" @click="zoomOut">
            <span class="control-button__icon">➖</span>
          </button>
          <button class="control-button" @click="zoomIn">
            <span class="control-button__icon">➕</span>
          </button>
          <button class="control-button" @click="resetLightboxView">
            <span class="control-button__icon">⤢</span>
          </button>
          <button class="control-button" @click="rotate">
            <span class="control-button__icon">🔄</span>
          </button>
          <button class="control-button" @click="toggleFlipX">
            <span class="control-button__icon">↔️</span>
          </button>
          <button class="control-button" @click="toggleFlipY">
            <span class="control-button__icon">↕️</span>
          </button>
          <button class="control-button" @click="toggleFullscreen">
            <span class="control-button__icon">⛶</span>
          </button>
        </div>
      </div>
    </div>

    <div class="viewer-toasts">
      <transition-group name="toast" tag="div">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          class="viewer-toast"
          :class="`viewer-toast--${toast.variant}`">
          {{ toast.message }}
        </div>
      </transition-group>
    </div>
  </div>
</template>

<script setup lang="ts">
import ImageCanvas from "../components/ImageCanvas.vue";
import { useImageViewer } from "../composables/useImageViewer";
import { useSlideshow } from "../composables/useSlideshow";
import { useThumbnailCache } from "../composables/useThumbnailCache";
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  reactive,
  ref,
  watch,
} from "vue";

type SidebarNode = {
  path: string;
  name: string;
  depth: number;
  type: "system" | "favorite" | "directory";
  isDirectory: boolean;
  isExpanded: boolean;
  isLoading: boolean;
  hasLoadedChildren: boolean;
  children: SidebarNode[];
  favoriteId?: string;
};

type GalleryItem = {
  path: string;
  resource: string;
  name: string;
  extension?: string;
  modifiedAt: number;
  size: number;
};

type SortMode = "name-asc" | "name-desc" | "modified-desc" | "size-desc";
type ToastVariant = "info" | "success" | "error";
type ToastMessage = {
  id: number;
  message: string;
  variant: ToastVariant;
};

const imageList = ref<GalleryItem[]>([]);
const currentIndex = ref(0);
const thumbnailSize = ref(120);
const sortMode = ref<SortMode>("name-asc");
const searchKeyword = ref("");
const activeNodePath = ref("");
const lightboxVisible = ref(false);
const lightboxDirection = ref<"none" | "forward" | "backward">("none");
const systemRoots = ref<SidebarNode[]>([]);
const favoriteRoots = ref<SidebarNode[]>([]);
const nodeRegistry = reactive(new Map<string, SidebarNode>());
const selectedIndexes = ref<Set<number>>(new Set());
const lastSelectedIndex = ref<number | null>(null);
const dragPayload = reactive({
  indexes: [] as number[],
  sourcePath: "",
});
const dragOverPath = ref<string | null>(null);
const DRAG_MIME_TYPE = "application/x-photon-gallery";
const toasts = ref<ToastMessage[]>([]);
const toastTimers = new Map<number, ReturnType<typeof window.setTimeout>>();
let toastSeed = 0;

const {
  scale,
  rotation,
  flipX,
  flipY,
  offset,
  rotate,
  toggleFlipX,
  toggleFlipY,
  setScale,
  setOffset,
  resetView,
} = useImageViewer();

const { playing, start, stop } = useSlideshow();

const sortedItems = computed(() => {
  const items = [...imageList.value];
  switch (sortMode.value) {
    case "name-desc":
      return items.sort((a, b) =>
        b.name.localeCompare(a.name, undefined, { numeric: true })
      );
    case "modified-desc":
      return items.sort((a, b) => b.modifiedAt - a.modifiedAt);
    case "size-desc":
      return items.sort((a, b) => b.size - a.size);
    case "name-asc":
    default:
      return items.sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { numeric: true })
      );
  }
});

const galleryItems = computed(() => {
  const keyword = searchKeyword.value.trim().toLowerCase();
  if (!keyword) {
    return sortedItems.value;
  }
  return sortedItems.value.filter((item) =>
    item.name.toLowerCase().includes(keyword)
  );
});

const hasImages = computed(() => galleryItems.value.length > 0);
const canPlaySlideshow = computed(() => galleryItems.value.length > 1);
const currentImage = computed(
  () => galleryItems.value[currentIndex.value]?.resource ?? ""
);
const currentMetadata = computed(() => galleryItems.value[currentIndex.value]);
const selectedCount = computed(() => selectedIndexes.value.size);
const hasSelection = computed(() => selectedIndexes.value.size > 0);
const selectedGalleryItems = computed(() =>
  [...selectedIndexes.value]
    .map((idx) => galleryItems.value[idx])
    .filter((item): item is GalleryItem => !!item)
);

const currentFileName = computed(() => getFileName(currentImage.value));
const statusText = computed(() => {
  if (hasImages.value) {
    return `${currentIndex.value + 1} / ${galleryItems.value.length}`;
  }
  return "选择左侧目录以加载图片";
});

const currentNode = computed(() => {
  if (!activeNodePath.value) return null;
  return (
    nodeRegistry.get(activeNodePath.value) ??
    findNodeByPath(activeNodePath.value, favoriteRoots.value) ??
    findNodeByPath(activeNodePath.value, systemRoots.value) ??
    null
  );
});

const canAddFavorite = computed(
  () => !!currentNode.value && !currentNode.value.favoriteId
);

const flattenedFavorites = computed(() => flattenNodes(favoriteRoots.value));
const flattenedSystem = computed(() => flattenNodes(systemRoots.value));
const currentDirectoryLabel = computed(
  () => currentNode.value?.path ?? "未选择目录"
);
const galleryStyle = computed(() => ({
  "--thumb-size": `${thumbnailSize.value}px`,
}));
const galleryCount = computed(() => galleryItems.value.length);
const canPan = computed(() => scale.value > 1.02);

const galleryRef = ref<HTMLElement | null>(null);
const containerSize = reactive({ width: 0, height: 0 });
const scrollTop = ref(0);
let galleryResizeObserver: ResizeObserver | null = null;
const lightboxCanvasRef = ref<HTMLElement | null>(null);
const isPanning = ref(false);
const pointerState = reactive({
  pointerId: null as number | null,
  lastX: 0,
  lastY: 0,
  velocityX: 0,
  velocityY: 0,
});
let momentumFrame: number | null = null;
let stopWatchingDirectory: (() => void) | null = null;
const thumbnailCache = useThumbnailCache();

const columns = computed(() =>
  Math.max(
    1,
    Math.floor(
      containerSize.width / Math.max(80, thumbnailSize.value + 10)
    )
  )
);
const rowHeight = computed(() => thumbnailSize.value + 10);
const totalRows = computed(() =>
  Math.ceil(galleryItems.value.length / columns.value)
);
const visibleRows = computed(() =>
  Math.max(1, Math.ceil(containerSize.height / rowHeight.value))
);
const bufferRows = 3;
const startRow = computed(() =>
  Math.max(0, Math.floor(scrollTop.value / rowHeight.value) - bufferRows)
);
const endRow = computed(() =>
  Math.min(
    totalRows.value,
    startRow.value + visibleRows.value + bufferRows * 2
  )
);
const startIndex = computed(() => startRow.value * columns.value);
const endIndex = computed(() =>
  Math.min(galleryItems.value.length, endRow.value * columns.value)
);
const virtualItems = computed(() =>
  galleryItems.value.slice(startIndex.value, endIndex.value)
);
const topSpacer = computed(() => startRow.value * rowHeight.value);
const bottomSpacer = computed(() =>
  Math.max(0, (totalRows.value - endRow.value) * rowHeight.value)
);

onMounted(async () => {
  await bootstrapSidebar();
  setupGalleryObservers();
  window.addEventListener("keydown", handleKeydown);
});

onBeforeUnmount(() => {
  destroyGalleryObservers();
  window.removeEventListener("keydown", handleKeydown);
  cancelMomentum();
  clearToastTimers();
  stopWatchingDirectory?.();
  stopWatchingDirectory = null;
});

watch(hasImages, async (value) => {
  if (value) {
    await nextTick();
    destroyGalleryObservers();
    setupGalleryObservers();
  } else {
    destroyGalleryObservers();
  }
});

watch(thumbnailSize, async () => {
  if (!hasImages.value) return;
  await nextTick();
  destroyGalleryObservers();
  setupGalleryObservers();
});

watch(hasImages, async (value) => {
  if (value) {
    await nextTick();
    destroyGalleryObservers();
    setupGalleryObservers();
  } else {
    destroyGalleryObservers();
  }
});

async function bootstrapSidebar() {
  await Promise.all([loadSystemDirectories(), loadFavorites()]);
}

function setupGalleryObservers() {
  const el = galleryRef.value;
  if (!el) return;
  const onScroll = () => {
    scrollTop.value = el.scrollTop;
  };
  el.addEventListener("scroll", onScroll);

  galleryResizeObserver = new ResizeObserver((entries) => {
    const entry = entries[0];
    containerSize.width = entry.contentRect.width;
    containerSize.height = entry.contentRect.height;
  });
  galleryResizeObserver.observe(el);

  (setupGalleryObservers as any).cleanup = () => {
    el.removeEventListener("scroll", onScroll);
  };
}

function destroyGalleryObservers() {
  if ((setupGalleryObservers as any).cleanup) {
    (setupGalleryObservers as any).cleanup();
  }
  if (galleryResizeObserver) {
    galleryResizeObserver.disconnect();
    galleryResizeObserver = null;
  }
}

type CreateNodeOptions = {
  path: string;
  name: string;
  depth: number;
  type: "system" | "favorite" | "directory";
  favoriteId?: string;
  register?: boolean;
  reuseExisting?: boolean;
};

function createNode({
  path,
  name,
  depth,
  type,
  favoriteId,
  register = true,
  reuseExisting = true,
}: CreateNodeOptions): SidebarNode {
  const existing = nodeRegistry.get(path);
  if (register && reuseExisting && existing) {
    existing.name = name;
    existing.type = type;
    if (favoriteId) existing.favoriteId = favoriteId;
    return existing;
  }

  const node: SidebarNode = {
    path,
    name,
    depth,
    type,
    isDirectory: true,
    isExpanded: false,
    isLoading: false,
    hasLoadedChildren: false,
    children: [],
    favoriteId,
  };
  if (register) {
    nodeRegistry.set(path, node);
  }
  return node;
}

function findNodeByPath(path: string, roots: SidebarNode[]) {
  const stack = [...roots];
  while (stack.length) {
    const node = stack.shift();
    if (!node) continue;
    if (node.path === path) {
      return node;
    }
    if (node.children?.length) {
      stack.push(...node.children);
    }
  }
  return null;
}

async function loadSystemDirectories() {
  const fs = window.electron?.fs;
  if (!fs) return;
  const dirs = await fs.getSystemDirectories();
  systemRoots.value = dirs.map((dir) =>
    createNode({ path: dir.path, name: dir.name, depth: 0, type: "system" })
  );
}

async function loadFavorites() {
  const favorites = await window.electron?.favorites.list();
  if (!favorites) {
    favoriteRoots.value = [];
    return;
  }
  favoriteRoots.value = favorites.map((fav) =>
    createNode({
      path: fav.path,
      name: fav.name,
      depth: 0,
      type: "favorite",
      favoriteId: fav.id,
      register: false,
      reuseExisting: false,
    })
  );
}

function flattenNodes(nodes: SidebarNode[]) {
  const result: SidebarNode[] = [];

  const traverse = (node: SidebarNode) => {
    result.push(node);
    if (node.isExpanded) {
      node.children.forEach(traverse);
    }
  };

  nodes.forEach(traverse);
  return result;
}

async function toggleNode(node: SidebarNode) {
  if (node.isLoading) return;
  if (!node.hasLoadedChildren) {
    await loadChildren(node);
  }
  node.isExpanded = !node.isExpanded;
}

async function loadChildren(node: SidebarNode) {
  const fs = window.electron?.fs;
  if (!fs) return;
  node.isLoading = true;
  const result = await fs.readDirectory(node.path, { filter: "all" });
  const registerChildren = node.type !== "favorite";
  node.children = result.items
    .filter((item) => item.type === "directory")
    .map((item) =>
      createNode({
        path: item.path,
        name: item.name,
        depth: node.depth + 1,
        type: "directory",
        register: registerChildren,
        reuseExisting: registerChildren,
      })
    );
  node.hasLoadedChildren = true;
  node.isLoading = false;
}

async function selectNode(node: SidebarNode) {
  activeNodePath.value = node.path;
  await loadImagesForDirectory(node.path);
  subscribeDirectoryWatcher(node.path);
}

async function loadImagesForDirectory(path: string) {
  const fs = window.electron?.fs;
  if (!fs) return;
  const result = await fs.readDirectory(path, { filter: "images" });
  imageList.value =
    result?.items
      .filter((item) => item.type === "file")
      .map((item) => ({
        path: item.path,
        resource: toImageResource(item.path),
        name: item.name,
        extension: item.extension,
        modifiedAt: item.modifiedAt,
        size: item.size,
      })) ?? [];
  currentIndex.value = 0;
  lightboxVisible.value = false;
  resetLightboxView();
}

function subscribeDirectoryWatcher(path: string) {
  if (!window.electron?.fs?.watchDirectory) return;
  stopWatchingDirectory?.();
  stopWatchingDirectory = window.electron.fs.watchDirectory(path, () => {
    refreshCurrentDirectory();
  });
}

function toImageResource(filePath: string) {
  return `photon-file://resource?path=${encodeURIComponent(filePath)}`;
}

function getFileName(source: string) {
  if (!source) return "";
  try {
    const url = new URL(source);
    return decodeURIComponent(url.pathname.split("/").pop() || "");
  } catch {
    const segments = source.split("/");
    return segments[segments.length - 1] || "";
  }
}

watch(galleryItems, (list) => {
  if (!list.length) {
    currentIndex.value = 0;
    if (playing.value) playing.value = false;
    lightboxVisible.value = false;
    stop();
    return;
  }
  if (currentIndex.value >= list.length) {
    currentIndex.value = 0;
  }
  selectedIndexes.value = new Set(
    [...selectedIndexes.value].filter((idx) => idx < list.length)
  );
});

watch(playing, (isPlaying) => {
  if (isPlaying && canPlaySlideshow.value) {
    start(() => {
      if (!galleryItems.value.length) return;
      currentIndex.value =
        (currentIndex.value + 1) % galleryItems.value.length;
    });
  } else {
    stop();
  }
});

watch(searchKeyword, async () => {
  currentIndex.value = 0;
  await nextTick();
  if (galleryRef.value) {
    galleryRef.value.scrollTop = 0;
    scrollTop.value = 0;
  }
  selectedIndexes.value = new Set();
  lastSelectedIndex.value = null;
});

watch(
  () => virtualItems.value.map((item) => item.resource),
  (resources) => {
    thumbnailCache.prefetchMany(resources);
  },
  { immediate: true }
);

watch(
  () => galleryItems.value.map((item) => item.resource),
  (resources) => {
    thumbnailCache.retain(resources);
  }
);

const toggleSlideshow = () => {
  if (!canPlaySlideshow.value) return;
  playing.value = !playing.value;
};
const toggleFullscreen = () => window.electron?.toggleFullscreen();
const zoomStep = 0.2;

const zoomIn = () => zoomTo(scale.value + zoomStep);
const zoomOut = () => zoomTo(scale.value - zoomStep);

function zoomTo(targetScale: number, origin?: { x: number; y: number }) {
  const previous = scale.value || 1;
  setScale(targetScale);
  applyOffset(offset.x, offset.y);

  if (!origin || !lightboxCanvasRef.value || scale.value <= 1 || previous === scale.value) {
    if (scale.value <= 1) {
      setOffset(0, 0);
    }
    return;
  }

  const rect = lightboxCanvasRef.value.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  const deltaRatio = scale.value / previous - 1;
  if (!isFinite(deltaRatio)) return;
  const relativeX = origin.x - centerX;
  const relativeY = origin.y - centerY;
  applyOffset(offset.x - relativeX * deltaRatio, offset.y - relativeY * deltaRatio);
}

const prevImage = () => {
  const length = galleryItems.value.length;
  if (!length) return;
  lightboxDirection.value = "backward";
  currentIndex.value = (currentIndex.value - 1 + length) % length;
};
const nextImage = () => {
  const length = galleryItems.value.length;
  if (!length) return;
  lightboxDirection.value = "forward";
  currentIndex.value = (currentIndex.value + 1) % length;
};
const resetLightboxView = () => {
  cancelMomentum();
  resetView();
};

const openLightbox = (index: number) => {
  if (index < 0 || index >= galleryItems.value.length) return;
  resetLightboxView();
  currentIndex.value = index;
  lightboxVisible.value = true;
  lightboxDirection.value = "none";
};
const closeLightbox = () => {
  resetLightboxView();
  lightboxVisible.value = false;
  lightboxDirection.value = "none";
};

async function addCurrentToFavorites() {
  const node = currentNode.value;
  if (!node || !window.electron?.favorites) return;
  await window.electron.favorites.add(node.path, node.name);
  await loadFavorites();
}

async function removeFavorite(id: string) {
  if (!window.electron?.favorites) return;
  await window.electron.favorites.remove(id);
  await loadFavorites();
}

async function openDirectoryPicker() {
  const result = await window.electron?.selectFolder();
  if (!result?.directory) return;
  await window.electron?.favorites.add(
    result.directory,
    extractName(result.directory)
  );
  await loadFavorites();
  const node = nodeRegistry.get(result.directory);
  if (node) {
    await selectNode(node);
  }
}

function extractName(path: string) {
  const segments = path.split(/[/\\]/).filter(Boolean);
  return segments[segments.length - 1] || path;
}

function formatFileSize(size: number) {
  if (!size) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  let index = 0;
  let value = size;
  while (value >= 1024 && index < units.length - 1) {
    value /= 1024;
    index++;
  }
  return `${value.toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}

function formatDate(timestamp: number) {
  const date = new Date(timestamp);
  return date.toLocaleDateString();
}

function getThumbnailSrc(resource: string) {
  const cached = thumbnailCache.get(resource);
  if (cached) return cached;
  thumbnailCache.prefetch(resource);
  return resource;
}

function isThumbnailReady(resource: string) {
  return thumbnailCache.isReady(resource);
}

function handleGallerySelection(event: MouseEvent, index: number) {
  const meta = event.metaKey || event.ctrlKey;
  const shift = event.shiftKey;
  if (shift && lastSelectedIndex.value != null) {
    selectRange(lastSelectedIndex.value, index);
  } else if (meta) {
    toggleSelection(index);
  } else {
    replaceSelection(index);
  }
  lastSelectedIndex.value = index;
}

function replaceSelection(index: number) {
  selectedIndexes.value = new Set([index]);
  currentIndex.value = index;
}

function toggleSelection(index: number) {
  const next = new Set(selectedIndexes.value);
  if (next.has(index)) {
    next.delete(index);
  } else {
    next.add(index);
  }
  selectedIndexes.value = next;
  currentIndex.value = index;
}

function selectRange(from: number, to: number) {
  const start = Math.min(from, to);
  const end = Math.max(from, to);
  const next = new Set(selectedIndexes.value);
  for (let i = start; i <= end; i++) {
    next.add(i);
  }
  selectedIndexes.value = next;
}

function ensureSelection(index: number) {
  if (!selectedIndexes.value.has(index)) {
    replaceSelection(index);
  }
}

function handleGalleryDragStart(event: DragEvent, index: number) {
  if (!galleryItems.value.length) return;
  ensureSelection(index);
  const indexes = [...selectedIndexes.value];
  if (!indexes.length) return;
  dragPayload.indexes = indexes;
  dragPayload.sourcePath = currentNode.value?.path ?? "";
  if (event.dataTransfer) {
    event.dataTransfer.setData(DRAG_MIME_TYPE, JSON.stringify(indexes));
    event.dataTransfer.setData("text/plain", `${indexes.length} 个项目`);
    event.dataTransfer.effectAllowed = "copyMove";
  }
}

function handleGalleryDragEnd() {
  clearDragPayload();
}

function handleNodeDragEnter(node: SidebarNode, event: DragEvent) {
  if (!canDropOnNode(node)) return;
  event.preventDefault();
  dragOverPath.value = node.path;
  setDropEffect(event);
}

function handleNodeDragOver(node: SidebarNode, event: DragEvent) {
  if (!canDropOnNode(node)) return;
  event.preventDefault();
  dragOverPath.value = node.path;
  setDropEffect(event);
}

function handleNodeDragLeave(node: SidebarNode, _event: DragEvent) {
  if (dragOverPath.value === node.path) {
    dragOverPath.value = null;
  }
}

async function handleNodeDrop(node: SidebarNode, event: DragEvent) {
  if (!window.electron?.fileOps) return;
  if (!dragPayload.indexes.length) return;
  event.preventDefault();
  const targetPath = node.path;
  dragOverPath.value = null;
  if (!targetPath) {
    clearDragPayload();
    return;
  }
  const items = getDraggedItems();
  if (!items.length) {
    clearDragPayload();
    return;
  }
  const copyMode = event.altKey || event.metaKey;
  if (!copyMode && dragPayload.sourcePath && dragPayload.sourcePath === targetPath) {
    showToast("图片已在当前目录中", "info");
    clearDragPayload();
    return;
  }
  const paths = items.map((item) => item.path);
  const operation = copyMode ? "copy" : "move";

  try {
    if (operation === "copy") {
      await window.electron.fileOps.copy(paths, targetPath);
      showToast(`已复制 ${paths.length} 张到 ${node.name}`, "success");
    } else {
      await window.electron.fileOps.move(paths, targetPath);
      selectedIndexes.value = new Set();
      lastSelectedIndex.value = null;
      showToast(`已移动 ${paths.length} 张到 ${node.name}`, "success");
    }
    if (
      (dragPayload.sourcePath &&
        dragPayload.sourcePath === activeNodePath.value &&
        operation === "move") ||
      targetPath === activeNodePath.value
    ) {
      await refreshCurrentDirectory();
    }
  } catch (error) {
    console.error(error);
    showToast("操作失败，请重试", "error");
  } finally {
    clearDragPayload();
  }
}

function canDropOnNode(node: SidebarNode) {
  return (
    !!node.path &&
    !!dragPayload.indexes.length &&
    node.isDirectory
  );
}

function getDraggedItems(indexes = dragPayload.indexes) {
  return indexes
    .map((idx) => galleryItems.value[idx])
    .filter((item): item is GalleryItem => !!item);
}

function setDropEffect(event: DragEvent) {
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = event.altKey || event.metaKey ? "copy" : "move";
  }
}

function clearDragPayload() {
  dragPayload.indexes = [];
  dragPayload.sourcePath = "";
  dragOverPath.value = null;
}


function selectAll() {
  if (!galleryItems.value.length) return;
  const next = new Set<number>();
  for (let i = 0; i < galleryItems.value.length; i++) {
    next.add(i);
  }
  selectedIndexes.value = next;
  currentIndex.value = 0;
  lastSelectedIndex.value = galleryItems.value.length - 1;
}

function handleKeydown(event: KeyboardEvent) {
  const meta = event.metaKey || event.ctrlKey;
  const key = event.key.toLowerCase();
  if (meta && key === "o") {
    event.preventDefault();
    openDirectoryPicker();
    return;
  }
  if (meta && event.shiftKey && key === "c" && hasSelection.value) {
    event.preventDefault();
    copySelectedToDirectory();
    return;
  }
  if (meta && event.shiftKey && key === "m" && hasSelection.value) {
    event.preventDefault();
    moveSelectedToDirectory();
    return;
  }
  if (meta && key === "a") {
    event.preventDefault();
    selectAll();
    return;
  }
  if (meta && key === "c" && hasSelection.value) {
    event.preventDefault();
    copySelectedPaths();
    return;
  }
  if ((key === "delete" || key === "backspace") && hasSelection.value) {
    event.preventDefault();
    deleteSelected();
    return;
  }
  if (meta && key === "e" && hasSelection.value) {
    event.preventDefault();
    exportSelected();
    return;
  }
  if (key === "arrowleft") {
    event.preventDefault();
    prevImage();
    return;
  }
  if (key === "arrowright") {
    event.preventDefault();
    nextImage();
    return;
  }
  if (key === " " && hasImages.value) {
    event.preventDefault();
    if (lightboxVisible.value) {
      closeLightbox();
    } else {
      openLightbox(currentIndex.value);
    }
  }
}

function handleLightboxWheel(event: WheelEvent) {
  if (event.ctrlKey) {
    const multiplier = Math.exp(-event.deltaY / 480);
    zoomTo(scale.value * multiplier, { x: event.clientX, y: event.clientY });
    return;
  }

  if (canPan.value && scale.value > 1) {
    applyOffset(offset.x - event.deltaX, offset.y - event.deltaY);
    return;
  }

  if (Math.abs(event.deltaX) > Math.abs(event.deltaY) && Math.abs(event.deltaX) > 20) {
    if (event.deltaX > 0) {
      nextImage();
    } else {
      prevImage();
    }
    return;
  }

  if (event.deltaY < 0) {
    zoomIn();
  } else {
    zoomOut();
  }
}

function handlePointerDown(event: PointerEvent) {
  if (!canPan.value || scale.value <= 1) return;
  const target = event.currentTarget as HTMLElement | null;
  target?.setPointerCapture?.(event.pointerId);
  isPanning.value = true;
  pointerState.pointerId = event.pointerId;
  pointerState.lastX = event.clientX;
  pointerState.lastY = event.clientY;
  pointerState.velocityX = 0;
  pointerState.velocityY = 0;
  cancelMomentum();
}

function handlePointerMove(event: PointerEvent) {
  if (!isPanning.value || pointerState.pointerId !== event.pointerId) return;
  event.preventDefault();
  const dx = event.clientX - pointerState.lastX;
  const dy = event.clientY - pointerState.lastY;
  pointerState.velocityX = dx;
  pointerState.velocityY = dy;
  pointerState.lastX = event.clientX;
  pointerState.lastY = event.clientY;
  applyOffset(offset.x + dx, offset.y + dy);
}

function handlePointerUp(event: PointerEvent) {
  if (pointerState.pointerId !== event.pointerId) return;
  const target = event.currentTarget as HTMLElement | null;
  target?.releasePointerCapture?.(event.pointerId);
  isPanning.value = false;
  pointerState.pointerId = null;
  if (canPan.value && scale.value > 1) {
    startMomentum();
  } else {
    setOffset(0, 0);
  }
}

function handlePointerLeave(event: PointerEvent) {
  if (!isPanning.value) return;
  handlePointerUp(event);
}

function handlePointerCancel(event: PointerEvent) {
  if (!isPanning.value) return;
  handlePointerUp(event);
}

function applyOffset(nextX: number, nextY: number) {
  const { x, y } = clampOffset(nextX, nextY);
  setOffset(x, y);
}

function clampOffset(x: number, y: number) {
  const canvas = lightboxCanvasRef.value;
  if (!canvas || scale.value <= 1) {
    return { x: 0, y: 0 };
  }
  const rect = canvas.getBoundingClientRect();
  const extraX = ((scale.value - 1) * rect.width) / 2;
  const extraY = ((scale.value - 1) * rect.height) / 2;
  const padding = 48;
  const maxX = extraX + padding;
  const maxY = extraY + padding;
  return {
    x: Math.min(Math.max(x, -maxX), maxX),
    y: Math.min(Math.max(y, -maxY), maxY),
  };
}

function startMomentum() {
  cancelMomentum();
  let vx = pointerState.velocityX;
  let vy = pointerState.velocityY;
  if (Math.abs(vx) < 0.1 && Math.abs(vy) < 0.1) return;

  const step = () => {
    vx *= 0.92;
    vy *= 0.92;
    if (!canPan.value || scale.value <= 1) {
      cancelMomentum();
      setOffset(0, 0);
      return;
    }
    applyOffset(offset.x + vx, offset.y + vy);
    if (Math.abs(vx) < 0.1 && Math.abs(vy) < 0.1) {
      cancelMomentum();
      return;
    }
    momentumFrame = requestAnimationFrame(step);
  };

  momentumFrame = requestAnimationFrame(step);
}

function cancelMomentum() {
  if (momentumFrame) {
    cancelAnimationFrame(momentumFrame);
    momentumFrame = null;
  }
}

function showToast(
  message: string,
  variant: ToastVariant = "info",
  duration = 3200
) {
  const id = ++toastSeed;
  toasts.value.push({ id, message, variant });
  const timer = window.setTimeout(() => dismissToast(id), duration);
  toastTimers.set(id, timer);
}

function dismissToast(id: number) {
  toasts.value = toasts.value.filter((toast) => toast.id !== id);
  const timer = toastTimers.get(id);
  if (timer) {
    window.clearTimeout(timer);
    toastTimers.delete(id);
  }
}

function clearToastTimers() {
  toastTimers.forEach((timer) => window.clearTimeout(timer));
  toastTimers.clear();
}

async function copySelectedPaths() {
  if (!selectedGalleryItems.value.length) return;
  const text = selectedGalleryItems.value.map((item) => item.path).join("\n");
  if (!navigator.clipboard?.writeText) {
    showToast("当前环境不支持复制", "error");
    return;
  }
  try {
    await navigator.clipboard.writeText(text);
    showToast(`已复制 ${selectedGalleryItems.value.length} 条路径`, "success");
  } catch {
    showToast("复制失败，请重试", "error");
  }
}

async function deleteSelected() {
  if (!selectedGalleryItems.value.length || !window.electron?.fileOps) return;
  const confirmDelete = window.confirm(
    `确定要删除选中的 ${selectedGalleryItems.value.length} 张图片吗？`
  );
  if (!confirmDelete) return;
  try {
    await window.electron.fileOps.delete(
      selectedGalleryItems.value.map((item) => item.path)
    );
    selectedIndexes.value = new Set();
    lastSelectedIndex.value = null;
    await refreshCurrentDirectory();
    showToast(`已删除 ${selectedGalleryItems.value.length} 张图片`, "success");
  } catch (error) {
    console.error(error);
    showToast("删除失败，请重试", "error");
  }
}

function revealSelected() {
  const item = selectedGalleryItems.value[0];
  if (!item || !window.electron?.fileOps) return;
  window.electron.fileOps.reveal(item.path);
}

async function refreshCurrentDirectory() {
  if (activeNodePath.value) {
    await loadImagesForDirectory(activeNodePath.value);
  }
}

async function renameSelected() {
  if (selectedGalleryItems.value.length !== 1 || !window.electron?.fileOps)
    return;

  const item = selectedGalleryItems.value[0];
  const defaultName = item.name;
  const input = window.prompt("输入新的文件名", defaultName);
  if (!input) return;

  const normalized = normalizeNewName(input.trim(), item.name);
  if (!normalized || normalized === item.name) return;

  try {
    await window.electron.fileOps.rename(item.path, normalized);
    selectedIndexes.value = new Set();
    await refreshCurrentDirectory();
    showToast("重命名成功", "success");
  } catch (error) {
    console.error(error);
    showToast("重命名失败，请重试", "error");
  }
}

function normalizeNewName(input: string, originalName: string) {
  if (!input) return originalName;
  const hasExt = /\.[^./\\]+$/.test(input);
  if (hasExt) return input;
  const match = originalName.match(/\.[^./\\]+$/);
  if (match) {
    return `${input}${match[0]}`;
  }
  return input;
}

async function exportSelected() {
  if (!selectedGalleryItems.value.length || !window.electron?.fileOps) return;
  const destination = await window.electron?.selectDirectory?.({
    title: "选择导出目录",
  });
  if (!destination) return;

  try {
    await window.electron.fileOps.export(
      selectedGalleryItems.value.map((item) => item.path),
      destination
    );
    showToast(`已导出到 ${extractName(destination)}`, "success");
  } catch (error) {
    console.error(error);
    showToast("导出失败，请重试", "error");
  }
}

async function pickDestination(title: string) {
  return window.electron?.selectDirectory?.({ title });
}

async function copySelectedToDirectory() {
  if (!selectedGalleryItems.value.length || !window.electron?.fileOps) return;
  const destination = await pickDestination("选择复制到的目录");
  if (!destination) return;
  try {
    await window.electron.fileOps.copy(
      selectedGalleryItems.value.map((item) => item.path),
      destination
    );
    showToast(`已复制 ${selectedGalleryItems.value.length} 张到 ${extractName(destination)}`, "success");
    if (destination === activeNodePath.value) {
      await refreshCurrentDirectory();
    }
  } catch (error) {
    console.error(error);
    showToast("复制失败，请重试", "error");
  }
}

async function moveSelectedToDirectory() {
  if (!selectedGalleryItems.value.length || !window.electron?.fileOps) return;
  const destination = await pickDestination("选择移动到的目录");
  if (!destination) return;
  if (destination === activeNodePath.value) {
    showToast("已在当前目录，无需移动", "info");
    return;
  }

  try {
    await window.electron.fileOps.move(
      selectedGalleryItems.value.map((item) => item.path),
      destination
    );
    selectedIndexes.value = new Set();
    lastSelectedIndex.value = null;
    showToast(`已移动到 ${extractName(destination)}`, "success");
    await refreshCurrentDirectory();
    if (destination === activeNodePath.value) {
      await refreshCurrentDirectory();
    }
  } catch (error) {
    console.error(error);
    showToast("移动失败，请重试", "error");
  }
}
</script>

<style scoped>
.viewer {
  height: 100vh;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 0 clamp(16px, 4vw, 48px) 24px;
  color: var(--color-text);
  background: var(--color-window);
  box-sizing: border-box;
  overflow: hidden;
}

.viewer-body {
  flex: 1;
  display: flex;
  gap: 24px;
  min-height: 0;
}

.viewer-sidebar {
  width: 260px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
  border-radius: 20px;
  padding: 20px;
  border: 1px solid var(--color-divider);
  background: var(--color-sidebar);
  box-shadow: var(--color-shadow);
}

.viewer-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: 0;
}

.viewer-unified-toolbar {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 10px 14px;
  border-radius: 14px;
  border: 1px solid var(--color-divider);
  background: var(--color-surface);
  box-shadow: var(--color-shadow);
  position: sticky;
  top: 12px;
  z-index: 10;
  margin-top: 12px;
}

.toolbar-section {
  display: flex;
  align-items: center;
  gap: 12px;
}

.toolbar-section--left {
  flex: 1.2;
}

.toolbar-section--center {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
}

.toolbar-section--right {
  flex: 1;
  justify-content: flex-end;
  gap: 12px;
  display: flex;
  align-items: center;
}

.toolbar-icon-btn {
  width: 36px;
  height: 32px;
  border-radius: 8px;
  border: 1px solid var(--color-divider);
  background: #fff;
  color: var(--color-text);
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.2s ease, border-color 0.2s ease, transform 0.15s ease;
}

.toolbar-icon-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.toolbar-icon-btn:not(:disabled):hover {
  border-color: var(--color-primary);
  background: rgba(92, 107, 192, 0.15);
}

.toolbar-divider {
  width: 1px;
  height: 28px;
  background: var(--color-divider);
}

.toolbar-form {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.toolbar-label {
  font-size: 11px;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--color-muted);
}

.toolbar-slider {
  width: 140px;
}

.toolbar-select {
  border: 1px solid var(--color-divider);
  border-radius: 8px;
  padding: 4px 10px;
  background: transparent;
  color: var(--color-text);
}

.toolbar-search {
  flex: 1;
  border: 1px solid var(--color-divider);
  border-radius: 10px;
  padding: 6px 12px;
  background: transparent;
  color: var(--color-text);
}

.toolbar-count {
  font-size: 13px;
  color: var(--color-muted);
}

.toolbar-count--selected {
  font-weight: 600;
  color: var(--color-text);
}

.toolbar-selection {
  display: flex;
  align-items: center;
  gap: 10px;
}

.toolbar-action-buttons {
  display: flex;
  align-items: center;
  gap: 8px;
}

.viewer-sidebar__card {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.65);
  border: 1px solid rgba(0, 0, 0, 0.03);
  backdrop-filter: blur(12px);
  width: 100%;
  box-sizing: border-box;
}

.viewer-sidebar__card--tree {
  padding: 18px;
}

.sidebar-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.sidebar-card__title {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #5a5c66;
}

.sidebar-card__title p {
  margin: 0;
  font-size: 12px;
  letter-spacing: normal;
  text-transform: none;
  color: #8c90a2;
}

.sidebar-icon-btn {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  border: 1px solid var(--color-divider);
  background: var(--color-surface);
  color: var(--color-text);
  font-size: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.2s ease, border-color 0.2s ease, transform 0.15s ease;
}

.sidebar-icon-btn:hover {
  border-color: var(--color-primary);
  background: rgba(92, 107, 192, 0.15);
  transform: translateY(-1px);
}

.viewer-sidebar__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.viewer-sidebar__icon-btn {
  border: 1px solid var(--color-divider);
  background: transparent;
  color: var(--color-text);
  border-radius: 999px;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.viewer-sidebar__icon-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.viewer-sidebar__label {
  font-size: 12px;
  letter-spacing: 0.3em;
  text-transform: uppercase;
  color: var(--color-muted);
  margin: 0;
}

.viewer-sidebar__path {
  margin: 0;
  font-size: 14px;
  color: var(--color-text);
  word-break: break-all;
}
.viewer-sidebar__current {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.viewer-sidebar__empty {
  margin: 0;
  font-size: 13px;
  color: var(--color-muted);
}

.viewer-sidebar__tree {
  flex: 1;
  min-height: 0;
}

.directory-tree {
  display: flex;
  flex-direction: column;
  gap: 2px;
  max-height: 280px;
  overflow-y: auto;
  padding-right: 4px;
}

.directory-tree__row {
  display: flex;
  align-items: center;
  gap: 6px;
  height: 32px;
}

.directory-tree__toggle {
  width: 20px;
  border: none;
  background: transparent;
  color: var(--color-muted);
  cursor: pointer;
  font-size: 12px;
}

.directory-tree__main {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  height: 28px;
  border-radius: 10px;
  border: 1px solid transparent;
  background: transparent;
  color: inherit;
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease;
}

.directory-tree__main.is-active {
  border-color: var(--color-primary);
  background: rgba(10, 132, 255, 0.15);
}

.directory-tree__main.is-drop-target {
  border-color: var(--color-primary);
  background: rgba(10, 132, 255, 0.25);
  color: var(--color-text);
}

.directory-tree__icon {
  width: 18px;
  text-align: center;
}

.directory-tree__name {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-align: left;
}

.directory-tree__action {
  border: none;
  background: transparent;
  color: var(--color-muted);
  cursor: pointer;
  padding: 4px;
}

.viewer-workspace {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
}

.viewer-gallery {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 12px;
  border-radius: 18px;
  background: var(--color-surface);
  border: 1px solid var(--color-divider);
  box-shadow: var(--color-shadow);
  display: block;
}

.viewer-gallery__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(var(--thumb-size, 120px), var(--thumb-size, 120px)));
  grid-auto-rows: auto;
  justify-content: flex-start;
  gap: 12px;
  overflow-y: auto;
  padding-bottom: 12px;
  align-content: start;
}

.viewer-gallery__item {
  width: 120px;
  min-height: var(--thumb-size, 120px);
  border: 1px solid var(--color-divider);
  border-radius: 14px;
  padding: 8px 8px 10px;
  background: var(--color-surface);
  display: flex;
  flex-direction: column;
  gap: 6px;
  position: relative;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease,
    border-color 0.2s ease, background 0.2s ease;
}

.viewer-gallery__item:hover {
  transform: scale(1.02);
  box-shadow: 0 10px 30px rgba(66, 165, 245, 0.25);
}

.viewer-gallery__item.is-selected {
  border-color: var(--color-primary);
  background: rgba(92, 107, 192, 0.12);
  box-shadow: 0 10px 30px rgba(92, 107, 192, 0.35);
}

.viewer-gallery__spacer {
  width: 100%;
}

.viewer-gallery__item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 8px;
  pointer-events: none;
  display: block;
}

.viewer-gallery__asset {
  width: 100%;
  aspect-ratio: 1;
  border-radius: 10px;
  overflow: hidden;
  position: relative;
  background: linear-gradient(120deg, rgba(255, 255, 255, 0.12), rgba(92, 107, 192, 0.12), rgba(255, 255, 255, 0.12));
  background-size: 200% 200%;
  animation: viewer-skeleton 1.2s ease infinite;
}

.viewer-gallery__asset img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0;
  transform: scale(1.01);
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.viewer-gallery__asset.is-ready {
  animation: none;
  background: transparent;
}

.viewer-gallery__asset.is-ready img {
  opacity: 1;
  transform: scale(1);
}

.viewer-gallery__caption {
  margin: 4px 0 0;
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text);
  text-align: left;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.viewer-gallery__item.is-active {
  border-color: var(--color-primary);
  background: rgba(10, 132, 255, 0.12);
  box-shadow: 0 4px 20px rgba(10, 132, 255, 0.35);
}

.viewer-gallery__placeholder {
  text-align: center;
  color: var(--color-muted);
  margin: 0;
}

.viewer-toolbar {
  display: flex;
  gap: 16px;
  margin-bottom: 8px;
  align-items: center;
  border-radius: 12px;
  padding: 10px 16px;
  border: 1px solid var(--color-divider);
  background: var(--color-surface);
  box-shadow: var(--color-shadow);
}

.viewer-toolbar--secondary {
  margin-top: 4px;
  background: var(--color-popup);
}

.viewer-toolbar__group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.viewer-toolbar__label {
  font-size: 12px;
  letter-spacing: 0.2em;
  color: var(--color-muted);
}

.viewer-toolbar__slider {
  width: 160px;
}

.viewer-toolbar__select {
  background: transparent;
  border: 1px solid var(--color-divider);
  color: var(--color-text);
  border-radius: 10px;
  padding: 4px 14px;
}

.viewer-toolbar__search-input {
  background: transparent;
  border: 1px solid var(--color-divider);
  color: var(--color-text);
  border-radius: 10px;
  padding: 4px 12px;
  width: 200px;
}

.viewer-toolbar__count {
  font-size: 12px;
  color: var(--color-muted);
}

.viewer-toolbar__icon-btn {
  width: 34px;
  height: 34px;
  border-radius: 8px;
  border: 1px solid var(--color-divider);
  background: #fff;
  color: var(--color-text);
  cursor: pointer;
  transition: background 0.2s ease, border-color 0.2s ease;
}

.viewer-toolbar__icon-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.viewer-toolbar__icon-btn:not(:disabled):hover {
  background: rgba(66, 165, 245, 0.15);
  border-color: var(--color-primary-strong);
}

.has-tooltip {
  position: relative;
}

.has-tooltip::after {
  content: attr(data-tooltip);
  position: absolute;
  left: 50%;
  bottom: calc(100% + 8px);
  transform: translateX(-50%) translateY(4px);
  padding: 6px 10px;
  border-radius: 8px;
  background: rgba(28, 28, 30, 0.9);
  color: #fff;
  white-space: nowrap;
  font-size: 11px;
  letter-spacing: 0.05em;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.15s ease, transform 0.15s ease;
  z-index: 2;
}

.has-tooltip:hover::after,
.has-tooltip:focus-visible::after {
  opacity: 1;
  transform: translateX(-50%) translateY(0);
}

.viewer-lightbox {
  position: fixed;
  inset: 0;
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: center;
}

.viewer-lightbox__backdrop {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
}

.viewer-lightbox__content {
  position: relative;
  width: min(1000px, 90vw);
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 24px;
  border-radius: 24px;
  background: #080c1c;
  border: 1px solid rgba(255, 255, 255, 0.15);
  box-shadow: 0 25px 60px rgba(0, 0, 0, 0.5);
  z-index: 1;
}

.viewer-lightbox__close {
  position: absolute;
  top: 12px;
  right: 12px;
  border: none;
  background: transparent;
  color: #fff;
  font-size: 20px;
  cursor: pointer;
}

.viewer-lightbox__canvas {
  flex: 1;
  min-height: 420px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 18px;
  background: rgba(0, 0, 0, 0.65);
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.viewer-lightbox__canvas--pannable {
  cursor: grab;
}

.viewer-lightbox__canvas--pannable.is-grabbing {
  cursor: grabbing;
}

.viewer-lightbox__canvas :deep(.image-wrapper) {
  background: transparent;
  border: none;
  box-shadow: none;
}

.viewer-lightbox__meta {
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
  color: #d1d5db;
  font-size: 14px;
}
.viewer-lightbox__meta-details {
  font-size: 12px;
  color: var(--color-muted);
}

.viewer-lightbox__meta-details {
  font-size: 12px;
  color: var(--color-muted);
}

.viewer-lightbox__controls {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 12px;
}

.viewer-lightbox__canvas--forward :deep(.image-wrapper) {
  animation: viewer-slide-forward 220ms ease;
}

.viewer-lightbox__canvas--backward :deep(.image-wrapper) {
  animation: viewer-slide-backward 220ms ease;
}

.viewer-lightbox__canvas--none :deep(.image-wrapper) {
  animation: viewer-fade-in 220ms ease;
}

.control-button {
  width: 48px;
  height: 48px;
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 14px;
  padding: 0;
  background: rgba(255, 255, 255, 0.04);
  color: inherit;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: transform 0.15s, border-color 0.15s, background 0.15s;
}

.control-button__icon {
  font-size: 22px;
}

.control-button:hover:not(:disabled) {
  transform: translateY(-1px);
  border-color: rgba(255, 255, 255, 0.4);
  background: rgba(255, 255, 255, 0.08);
}

.control-button:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.viewer {
  height: 100vh;
  overflow: hidden;
  color: #333;
  background: #eceff5;
}

.viewer-sidebar {
  background: #f5f5f5;
  border: 1px solid #e0e4ed;
  box-shadow: 0 10px 30px rgba(92, 107, 192, 0.1);
}

.sidebar-action {
  border: 1px solid #d9deec;
  color: #333;
}

.sidebar-action--primary {
  background: linear-gradient(135deg, #5c6bc0, #42a5f5);
}

.viewer-sidebar__label {
  letter-spacing: 0.25em;
  color: #666;
}

.viewer-sidebar__path {
  color: #333;
}

.viewer-sidebar__empty {
  color: #999;
}

.directory-tree__toggle {
  color: #999;
}

.directory-tree__main.is-active,
.directory-tree__main.is-drop-target {
  border-color: #5c6bc0;
  background: rgba(92, 107, 192, 0.18);
  color: #333;
}

.viewer-workspace {
  min-height: 0;
}

.viewer-gallery {
  background: #ffffff;
  border-radius: 18px;
  border: 1px solid #e0e4ed;
  box-shadow: 0 10px 30px rgba(92, 107, 192, 0.08);
  padding: 12px;
}

.viewer-gallery__item {
  border-radius: 14px;
  border: 1px solid rgba(0, 0, 0, 0.05);
  background: #fafafa;
  box-shadow: none;
}

.viewer-gallery__item:hover {
  box-shadow: 0 8px 24px rgba(66, 165, 245, 0.25);
}

.viewer-gallery__item.is-selected,
.viewer-gallery__item.is-active {
  border-color: #5c6bc0;
  background: rgba(92, 107, 192, 0.15);
  box-shadow: 0 10px 30px rgba(92, 107, 192, 0.35);
}

.viewer-gallery__placeholder {
  color: #999;
}

.viewer-toolbar {
  border: 1px solid #e0e4ed;
  background: #fff;
  box-shadow: 0 6px 20px rgba(92, 107, 192, 0.08);
}

.viewer-toolbar--secondary {
  background: #f5f7fb;
}

.viewer-toolbar__label,
.viewer-toolbar__count {
  color: #666;
}

.viewer-toolbar__select,
.viewer-toolbar__search-input {
  border: 1px solid #d6dbe9;
  color: #333;
  background: #fff;
}

.viewer-toolbar__icon-btn {
  border: 1px solid #d6dbe9;
  background: #fff;
  color: #333;
}

.viewer-toolbar__icon-btn:not(:disabled):hover {
  background: rgba(66, 165, 245, 0.15);
  border-color: #42a5f5;
}

.viewer-toasts {
  position: fixed;
  right: 28px;
  bottom: 28px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  z-index: 50;
  pointer-events: none;
}

.viewer-toasts > div {
  display: contents;
}

.viewer-toast {
  min-width: 220px;
  padding: 12px 16px;
  border-radius: 14px;
  background: rgba(28, 28, 30, 0.88);
  color: #fff;
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.25);
  font-size: 13px;
  letter-spacing: 0.02em;
  pointer-events: auto;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.viewer-toast--success {
  background: rgba(16, 122, 87, 0.92);
}

.viewer-toast--error {
  background: rgba(176, 32, 32, 0.92);
}

.toast-enter-active,
.toast-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(8px) scale(0.96);
}
@keyframes viewer-slide-forward {
  from {
    transform: translateX(40px);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes viewer-slide-backward {
  from {
    transform: translateX(-40px);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes viewer-fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes viewer-skeleton {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

@media (max-width: 960px) {
  .viewer {
    flex-direction: column;
  }

  .viewer-sidebar {
    width: 100%;
  }
}

@media (max-width: 640px) {
  .viewer-lightbox__controls {
    flex-direction: column;
  }
}
</style>
