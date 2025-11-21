<template>
  <div class="viewer">
    <header class="viewer-unified-toolbar">
      <div class="toolbar-traffic-space" aria-hidden="true"></div>
      <div class="toolbar-section toolbar-section--left"></div>
      <div class="toolbar-section toolbar-section--center"></div>
      <div class="toolbar-section toolbar-section--right">
        <div
          class="toolbar-dropdown toolbar-dropdown--sort toolbar-interactive"
          :class="{ 'is-open': sortMenuOpen }"
          ref="sortMenuRef">
          <button
            class="toolbar-dropdown__trigger toolbar-dropdown__trigger--icon"
            :disabled="!hasImages"
            aria-label="排序"
            @click="toggleSortMenu">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path :d="TOOLBAR_ICONS.sort" />
            </svg>
          </button>
          <div
            v-if="sortMenuOpen"
            class="toolbar-dropdown__menu"
            role="menu">
            <button
              v-for="option in sortOptions"
              :key="option.value"
              class="toolbar-dropdown__item"
              role="menuitemradio"
              :aria-checked="sortMode === option.value"
              @click="() => selectSort(option.value)">
              <span class="toolbar-dropdown__check">
                {{ sortMode === option.value ? "✓" : "" }}
              </span>
              <span class="toolbar-dropdown__label">{{ option.label }}</span>
            </button>
          </div>
        </div>
        <div
          v-if="hasSelection"
          class="toolbar-selection toolbar-selection--dropdown"
          ref="actionsMenuRef">
          <span class="toolbar-count toolbar-count--selected">
            已选 {{ selectedCount }} 张
          </span>
          <div class="toolbar-dropdown" :class="{ 'is-open': actionsMenuOpen }">
            <button
              class="toolbar-dropdown__trigger toolbar-interactive"
              :disabled="!hasSelection"
              @click="toggleActionsMenu">
              操作
              <span class="toolbar-dropdown__chevron">⌄</span>
            </button>
            <div
              v-if="actionsMenuOpen"
              class="toolbar-dropdown__menu"
              role="menu">
              <button
                class="toolbar-dropdown__item"
                role="menuitem"
                :disabled="!hasSelection"
                @click="() => runAndClose(copySelectedPaths)">
                <span class="toolbar-dropdown__icon">
                  <svg viewBox="0 0 24 24">
                    <path d="M7 4h9a2 2 0 0 1 2 2v11H9a2 2 0 0 1-2-2V4zm2 2v9h7V6H9zm-3 1v9H5a2 2 0 0 1-2-2V7h3z" />
                  </svg>
                </span>
                复制路径
              </button>
              <button
                class="toolbar-dropdown__item"
                role="menuitem"
                :disabled="selectedCount !== 1"
                @click="() => runAndClose(revealSelected)">
                <span class="toolbar-dropdown__icon">
                  <svg viewBox="0 0 24 24">
                    <path d="M11 5a7 7 0 0 1 5.6 2.8L20 5.4 21.4 6.8 18.7 9.5A7 7 0 1 1 11 5zm0 2a5 5 0 1 0 3.9 8.1l1.2 1.2 1.4-1.4-1.2-1.2A5 5 0 0 0 11 7zm0 2a3 3 0 1 1 0 6 3 3 0 0 1 0-6z" />
                  </svg>
                </span>
                显示原文件
              </button>
              <button
                class="toolbar-dropdown__item"
                role="menuitem"
                :disabled="selectedCount !== 1"
                @click="() => runAndClose(renameSelected)">
                <span class="toolbar-dropdown__icon">
                  <svg viewBox="0 0 24 24">
                    <path d="M5 17.5V21h3.5l9.2-9.2-3.5-3.5L5 17.5zm12.1-8.6 1.4-1.4-2.5-2.5-1.4 1.4 2.5 2.5z" />
                  </svg>
                </span>
                重命名
              </button>
              <button
                class="toolbar-dropdown__item"
                role="menuitem"
                :disabled="!hasSelection"
                @click="() => runAndClose(copySelectedToDirectory)">
                <span class="toolbar-dropdown__icon">
                  <svg viewBox="0 0 24 24">
                    <path d="M4 6h5l2 2h9v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2zm0 4v8h14v-8H4zm7.5 1.5 1.5 1.5H11v3h-2v-3H7.5l1.5-1.5L11 9l0 2.5z" />
                  </svg>
                </span>
                复制到目录
              </button>
              <button
                class="toolbar-dropdown__item"
                role="menuitem"
                :disabled="!hasSelection"
                @click="() => runAndClose(moveSelectedToDirectory)">
                <span class="toolbar-dropdown__icon">
                  <svg viewBox="0 0 24 24">
                    <path d="M4 6h5l2 2h9v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2zm0 4v8h14v-8H4zm4 1h2.5V9l3.5 3-3.5 3v-2H8v-2z" />
                  </svg>
                </span>
                移动到目录
              </button>
              <button
                class="toolbar-dropdown__item"
                role="menuitem"
                :disabled="!hasSelection"
                @click="() => runAndClose(exportSelected)">
                <span class="toolbar-dropdown__icon">
                  <svg viewBox="0 0 24 24">
                    <path d="M11 3h2v8.1l2.95-2.95L17.4 9.6 12 15 6.6 9.6 8.05 8.15 11 11.1V3zM5 17h14v2H5z" />
                  </svg>
                </span>
                导出
              </button>
              <button
                class="toolbar-dropdown__item toolbar-dropdown__item--danger"
                role="menuitem"
                :disabled="!hasSelection"
                @click="() => runAndClose(deleteSelected)">
                <span class="toolbar-dropdown__icon">
                  <svg viewBox="0 0 24 24">
                    <path d="M9 4h6l1 2h4v2h-2v10a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V8H3V6h4l1-2zm0 4v10h6V8H9z" />
                  </svg>
                </span>
                删除
              </button>
            </div>
          </div>
        </div>
        <div
          v-if="lightboxVisible"
          class="toolbar-selection toolbar-selection--dropdown"
          ref="viewerMenuRef">
          <div class="toolbar-dropdown" :class="{ 'is-open': viewerMenuOpen }">
            <button
              class="toolbar-dropdown__trigger toolbar-dropdown__trigger--icon toolbar-interactive"
              :disabled="!lightboxVisible"
              aria-label="查看器操作"
              @click="toggleViewerMenu">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path :d="TOOLBAR_ICONS.viewer" />
              </svg>
            </button>
            <div
              v-if="viewerMenuOpen"
              class="toolbar-dropdown__menu"
              role="menu">
              <button class="toolbar-dropdown__item" role="menuitem" @click="() => runViewerAction(zoomIn)">
                <span class="toolbar-dropdown__icon">
                  <svg viewBox="0 0 24 24">
                    <path :d="TOOLBAR_ICONS.zoomIn" />
                  </svg>
                </span>
                放大
              </button>
              <button class="toolbar-dropdown__item" role="menuitem" @click="() => runViewerAction(zoomOut)">
                <span class="toolbar-dropdown__icon">
                  <svg viewBox="0 0 24 24">
                    <path :d="TOOLBAR_ICONS.zoomOut" />
                  </svg>
                </span>
                缩小
              </button>
              <button class="toolbar-dropdown__item" role="menuitem" @click="() => runViewerAction(resetLightboxView)">
                <span class="toolbar-dropdown__icon">
                  <svg viewBox="0 0 24 24">
                    <path :d="TOOLBAR_ICONS.reset" />
                  </svg>
                </span>
                基于窗口
              </button>
              <button class="toolbar-dropdown__item" role="menuitem" @click="() => runViewerAction(rotate)">
                <span class="toolbar-dropdown__icon">
                  <svg viewBox="0 0 24 24">
                    <path :d="TOOLBAR_ICONS.rotate" />
                  </svg>
                </span>
                旋转
              </button>
              <button class="toolbar-dropdown__item" role="menuitem" @click="() => runViewerAction(toggleFlipX)">
                <span class="toolbar-dropdown__icon">
                  <svg viewBox="0 0 24 24">
                    <path :d="TOOLBAR_ICONS.flipX" />
                  </svg>
                </span>
                水平翻转
              </button>
              <button class="toolbar-dropdown__item" role="menuitem" @click="() => runViewerAction(toggleFlipY)">
                <span class="toolbar-dropdown__icon">
                  <svg viewBox="0 0 24 24">
                    <path :d="TOOLBAR_ICONS.flipY" />
                  </svg>
                </span>
                垂直翻转
              </button>
              <button
                class="toolbar-dropdown__item"
                role="menuitem"
                @click="() => runViewerAction(toggleSlideshow)">
                <span class="toolbar-dropdown__icon">
                  <svg viewBox="0 0 24 24">
                    <path :d="playing ? TOOLBAR_ICONS.pause : TOOLBAR_ICONS.play" />
                  </svg>
                </span>
                {{ playing ? "暂停幻灯片" : "播放幻灯片" }}
              </button>
              <button
                class="toolbar-dropdown__item"
                role="menuitem"
                @click="() => runViewerAction(toggleFullscreen)">
                <span class="toolbar-dropdown__icon">
                  <svg viewBox="0 0 24 24">
                    <path :d="TOOLBAR_ICONS.fullscreen" />
                  </svg>
                </span>
                切换全屏
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>

    <div class="viewer-body">
      <aside class="viewer-sidebar">
        <div class="sidebar-utility">
          <button
            class="sidebar-utility__btn"
            title="打开目录"
            @click="openDirectoryPicker">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path :d="SIDEBAR_ICONS.folder" />
            </svg>
          </button>
          <button
            class="sidebar-utility__btn"
            title="刷新目录"
            @click="bootstrapSidebar">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path :d="SIDEBAR_ICONS.refresh" />
            </svg>
          </button>
          <button
            class="sidebar-utility__btn"
            :disabled="!canAddFavorite"
            title="收藏当前目录"
            @click="addCurrentToFavorites">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path :d="SIDEBAR_ICONS.star" />
            </svg>
          </button>
        </div>
        <nav class="sidebar-groups">
          <section class="sidebar-group">
            <header class="sidebar-group__header">
              <button
                type="button"
                class="sidebar-group__label"
                @click="toggleGroup('favorites')">
                <svg
                  class="sidebar-group__chevron"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                  :class="{ open: groupState.favorites }">
                  <path :d="SIDEBAR_ICONS.chevron" />
                </svg>
                收藏夹
              </button>
              <button
                class="sidebar-header-btn"
                :disabled="!canAddFavorite"
                title="添加收藏"
                @click="addCurrentToFavorites">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path :d="SIDEBAR_ICONS.plus" />
                </svg>
              </button>
            </header>
            <ul
              v-show="groupState.favorites"
              class="sidebar-list"
              role="list">
              <li
                v-for="node in flattenedFavorites"
                :key="node.path"
                class="sidebar-list__item">
                <div
                  class="sidebar-item-row"
                  :style="{ '--sidebar-indent': `${node.depth * 14}px` }">
                  <button
                    v-if="node.isDirectory"
                    class="sidebar-item__toggle"
                    :class="{ open: node.isExpanded }"
                    @click.stop="toggleNode(node)">
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path :d="SIDEBAR_ICONS.chevron" />
                    </svg>
                  </button>
                  <button
                    class="sidebar-item"
                    :class="{
                      'is-active': node.path === activeNodePath,
                      'is-drop-target': dragOverPath === node.path,
                    }"
                    @click="selectNode(node)"
                    @dragenter.prevent="handleNodeDragEnter(node, $event)"
                    @dragover.prevent="handleNodeDragOver(node, $event)"
                    @dragleave="handleNodeDragLeave(node, $event)"
                    @drop.prevent="handleNodeDrop(node, $event)">
                    <span class="sidebar-item__icon">
                      <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path :d="SIDEBAR_ICONS.star" />
                      </svg>
                    </span>
                    <span class="sidebar-item__name">{{ node.name }}</span>
                  </button>
                  <button
                    v-if="node.favoriteId"
                    class="sidebar-item__action"
                    title="移除收藏"
                    @click.stop="removeFavorite(node.favoriteId)">
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path :d="SIDEBAR_ICONS.close" />
                    </svg>
                  </button>
                </div>
              </li>
            </ul>
            <p v-if="!flattenedFavorites.length" class="sidebar-empty">
              还没有收藏，点击上方按钮添加
            </p>
          </section>

          <section class="sidebar-group">
            <header class="sidebar-group__header">
              <button
                type="button"
                class="sidebar-group__label"
                @click="toggleGroup('system')">
                <svg
                  class="sidebar-group__chevron"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                  :class="{ open: groupState.system }">
                  <path :d="SIDEBAR_ICONS.chevron" />
                </svg>
                系统目录
              </button>
            </header>
            <ul
              v-show="groupState.system"
              class="sidebar-list"
              role="list">
              <li
                v-for="node in flattenedSystem"
                :key="node.path"
                class="sidebar-list__item">
                <div
                  class="sidebar-item-row"
                  :style="{ '--sidebar-indent': `${node.depth * 14}px` }">
                  <button
                    v-if="node.isDirectory"
                    class="sidebar-item__toggle"
                    :class="{ open: node.isExpanded }"
                    @click.stop="toggleNode(node)">
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path :d="SIDEBAR_ICONS.chevron" />
                    </svg>
                  </button>
                  <button
                    class="sidebar-item"
                    :class="{
                      'is-active': node.path === activeNodePath,
                      'is-drop-target': dragOverPath === node.path,
                    }"
                    @click="selectNode(node)"
                    @dragenter.prevent="handleNodeDragEnter(node, $event)"
                    @dragover.prevent="handleNodeDragOver(node, $event)"
                    @dragleave="handleNodeDragLeave(node, $event)"
                    @drop.prevent="handleNodeDrop(node, $event)">
                    <span class="sidebar-item__icon">
                      <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path :d="SIDEBAR_ICONS.folder" />
                      </svg>
                    </span>
                    <span class="sidebar-item__name">{{ node.name }}</span>
                  </button>
                </div>
              </li>
            </ul>
            <p v-if="!flattenedSystem.length" class="sidebar-empty">
              未发现系统目录
            </p>
          </section>

          <section class="sidebar-group">
            <header class="sidebar-group__header">
              <button
                type="button"
                class="sidebar-group__label"
                @click="toggleGroup('custom')">
                <svg
                  class="sidebar-group__chevron"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                  :class="{ open: groupState.custom }">
                  <path :d="SIDEBAR_ICONS.chevron" />
                </svg>
                自定义目录
              </button>
              <button
                class="sidebar-header-btn"
                title="添加自定义目录"
                @click="addCustomDirectory">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path :d="SIDEBAR_ICONS.plus" />
                </svg>
              </button>
            </header>
            <ul
              v-show="groupState.custom"
              class="sidebar-list"
              role="list">
              <li
                v-for="node in flattenedCustom"
                :key="node.path"
                class="sidebar-list__item">
                <div class="sidebar-item-row">
                  <button
                    class="sidebar-item"
                    :class="{
                      'is-active': node.path === activeNodePath,
                      'is-drop-target': dragOverPath === node.path,
                    }"
                    @click="selectNode(node)"
                    @dragenter.prevent="handleNodeDragEnter(node, $event)"
                    @dragover.prevent="handleNodeDragOver(node, $event)"
                    @dragleave="handleNodeDragLeave(node, $event)"
                    @drop.prevent="handleNodeDrop(node, $event)">
                    <span class="sidebar-item__icon">
                      <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path :d="SIDEBAR_ICONS.user" />
                      </svg>
                    </span>
                    <span class="sidebar-item__name">{{ node.name }}</span>
                  </button>
                  <button
                    class="sidebar-item__action"
                    title="移除目录"
                    @click.stop="removeCustomDirectory(node.customId)">
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path :d="SIDEBAR_ICONS.close" />
                    </svg>
                  </button>
                </div>
              </li>
            </ul>
            <p v-if="!flattenedCustom.length" class="sidebar-empty">
              添加常用的工作目录以便快速访问
            </p>
          </section>

          <section class="sidebar-group">
            <header class="sidebar-group__header">
              <button
                type="button"
                class="sidebar-group__label"
                @click="toggleGroup('recent')">
                <svg
                  class="sidebar-group__chevron"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                  :class="{ open: groupState.recent }">
                  <path :d="SIDEBAR_ICONS.chevron" />
                </svg>
                最近使用
              </button>
            </header>
            <ul
              v-show="groupState.recent"
              class="sidebar-list"
              role="list">
              <li
                v-for="entry in recentList"
                :key="entry.path"
                class="sidebar-list__item">
                <button
                  class="sidebar-item"
                  :class="{ 'is-active': entry.path === activeNodePath }"
                  @click="openRecent(entry)">
                  <span class="sidebar-item__icon">
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path :d="SIDEBAR_ICONS.clock" />
                    </svg>
                  </span>
                  <span class="sidebar-item__name">{{ entry.name }}</span>
                </button>
              </li>
            </ul>
            <p v-if="!recentList.length" class="sidebar-empty">
              暂无记录
            </p>
          </section>

        </nav>
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
        <button
          class="viewer-lightbox__nav viewer-lightbox__nav--prev"
          :disabled="galleryItems.length < 2"
          @click="prevImage">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path :d="SIDEBAR_ICONS.chevron" />
          </svg>
        </button>
        <button
          class="viewer-lightbox__nav viewer-lightbox__nav--next"
          :disabled="galleryItems.length < 2"
          @click="nextImage">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path :d="SIDEBAR_ICONS.chevron" />
          </svg>
        </button>
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
  type: "system" | "favorite" | "directory" | "custom" | "history";
  isDirectory: boolean;
  isExpanded: boolean;
  isLoading: boolean;
  hasLoadedChildren: boolean;
  children: SidebarNode[];
  favoriteId?: string;
  customId?: string;
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
const SIDEBAR_ICONS: Record<string, string> = {
  folder:
    "M3.5 6.75h5.1l1.6 2.4h10.3c1.1 0 2 .9 2 2v8.1c0 1.1-.9 2-2 2H3.5c-1.1 0-2-.9-2-2V8.75c0-1.1.9-2 2-2z",
  star:
    "M12 4.5l2.5 4.9 5.4.8-3.9 3.8.9 5.5L12 16.8l-4.9 2.7.9-5.5-3.9-3.8 5.4-.8z",
  clock:
    "M12 4a8 8 0 1 1 0 16 8 8 0 0 1 0-16zm-.75 3.5v5.25L15 15.2l-.75 1.3-4.5-2.6V7.5z",
  user:
    "M12 6a3 3 0 1 1 0 6 3 3 0 0 1 0-6zm0 7.5c3.2 0 5.5 1.7 5.5 3.6V18H6.5v-.9c0-1.9 2.3-3.6 5.5-3.6z",
  plus: "M12 5v6H6v2h6v6h2v-6h6v-2h-6V5z",
  refresh:
    "M12 4a8 8 0 0 1 7.9 7.1H22l-3.3 3.9L15.5 11h2.1A6 6 0 1 0 18 13h2a8 8 0 1 1-8-9z",
  chevron: "M9 6l6 6-6 6",
  close:
    "M8.5 8.5l6.9 6.9m0-6.9-6.9 6.9",
};
const TOOLBAR_ICONS = {
  viewer:
    "M6 7h3.2l1.2-1.5h3.2L14.8 7H18a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2zm6 3a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7zm0 2a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zm5-1.5h-2v-1h2z",
  sort:
    "M8 5h8v2H8zm-2 4h12v2H6zm2 4h8v2H8z",
  zoomIn:
    "M11 4a7 7 0 1 1 0 14 7 7 0 0 1 0-14zm0 2a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm-.75 2.5h1.5v1.75H13.5v1.5h-1.75V13.5h-1.5v-1.75H8.5v-1.5h1.75V8.5zM18.5 18.5l3 3-1.5 1.5-3-3z",
  zoomOut:
    "M11 4a7 7 0 1 1 0 14 7 7 0 0 1 0-14zm0 2a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm-2.5 4.25h5v1.5h-5zM18.5 18.5l3 3-1.5 1.5-3-3z",
  reset: "M12 5a7 7 0 1 1-6.8 5.3l2 0.4A5 5 0 1 0 12 7v2.5L8 6l4-3.5z",
  rotate:
    "M12 4a6 6 0 0 1 5.8 7.4l-1.9-.5A4 4 0 0 0 12 6v2L7.5 4.5 12 1v3zM6 12a6 6 0 0 0 9.5 4.9l1.1 1.6A8 8 0 1 1 6 5.1L7.2 6.7A6 6 0 0 0 6 12z",
  flipX: "M5 6h14v2H5zm0 10h14v2H5zM7 9h2v6H7zm4 0h2v6h-2zm4 0h2v6h-2z",
  flipY: "M6 5h2v14H6zm10 0h2v14h-2zM9 7h6v2H9zm0 4h6v2H9zm0 4h6v2H9z",
  play:
    "M8.5 6.5l8 5.5-8 5.5v-11zM5 6h2v12H5z",
  pause: "M7 6h3v12H7zm7 0h3v12h-3z",
  fullscreen:
    "M6 6h5v2H8v3H6zm10 0v5h-2V8h-3V6zm-3 10h3v-3h2v5h-5zm-4 0v2H6v-5h2v3z",
};
type RecentEntry = { path: string; name: string };
type CustomEntry = { id: string; path: string; name: string };

const imageList = ref<GalleryItem[]>([]);
const currentIndex = ref(0);
const THUMBNAIL_SIZE = 120;
const sortMode = ref<SortMode>("name-asc");
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
const RECENT_STORAGE_KEY = "photon:sidebar:recents";
const CUSTOM_STORAGE_KEY = "photon:sidebar:custom";
const DRAG_MIME_TYPE = "application/x-photon-gallery";
const toasts = ref<ToastMessage[]>([]);
const toastTimers = new Map<number, ReturnType<typeof window.setTimeout>>();
let toastSeed = 0;
const actionsMenuOpen = ref(false);
const actionsMenuRef = ref<HTMLElement | null>(null);
const sortMenuOpen = ref(false);
const sortMenuRef = ref<HTMLElement | null>(null);
const recentDirectories = ref<RecentEntry[]>([]);
const customEntries = ref<CustomEntry[]>([]);
const customRoots = ref<SidebarNode[]>([]);
const groupState = reactive({
  favorites: true,
  system: true,
  recent: true,
  custom: true,
});
const toggleGroup = (key: keyof typeof groupState) => {
  groupState[key] = !groupState[key];
};
const viewerMenuOpen = ref(false);
const viewerMenuRef = ref<HTMLElement | null>(null);
const sortOptions: Array<{ value: SortMode; label: string }> = [
  { value: "name-asc", label: "名称 A→Z" },
  { value: "name-desc", label: "名称 Z→A" },
  { value: "modified-desc", label: "最近修改" },
  { value: "size-desc", label: "文件大小" },
];

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

const galleryItems = computed(() => sortedItems.value);

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
const flattenedCustom = computed(() => flattenNodes(customRoots.value));
const recentList = computed(() => recentDirectories.value);
const currentDirectoryLabel = computed(
  () => currentNode.value?.path ?? "未选择目录"
);
const galleryStyle = computed(() => ({
  "--thumb-size": `${THUMBNAIL_SIZE}px`,
}));
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
let cleanupAppAction: (() => void) | null = null;
let handleOutsideClick: ((event: MouseEvent) => void) | null = null;

const columns = computed(() =>
  Math.max(1, Math.floor(containerSize.width / Math.max(80, THUMBNAIL_SIZE + 10)))
);
const rowHeight = computed(() => THUMBNAIL_SIZE + 10);
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
  loadCustomDirectories();
  loadRecentDirectories();
  await bootstrapSidebar();
  setupGalleryObservers();
  window.addEventListener("keydown", handleKeydown);
  handleOutsideClick = (event: MouseEvent) => {
    const target = event.target as Node;
    if (actionsMenuOpen.value) {
      const menuEl = actionsMenuRef.value;
      if (menuEl && !menuEl.contains(target)) {
        closeActionsMenu();
      }
    }
    if (sortMenuOpen.value) {
      const sortEl = sortMenuRef.value;
      if (sortEl && !sortEl.contains(target)) {
        closeSortMenu();
      }
    }
    if (viewerMenuOpen.value) {
      const viewerEl = viewerMenuRef.value;
      if (viewerEl && !viewerEl.contains(target)) {
        closeViewerMenu();
      }
    }
  };
  document.addEventListener("mousedown", handleOutsideClick);
  if (window.electron?.onAction) {
    cleanupAppAction = window.electron.onAction((payload) => {
      if (payload.type === "open-directory") {
        openDirectoryPicker();
      } else if (payload.type === "refresh-directory") {
        bootstrapSidebar();
      }
    });
  }
});

onBeforeUnmount(() => {
  destroyGalleryObservers();
  window.removeEventListener("keydown", handleKeydown);
  cancelMomentum();
  clearToastTimers();
  stopWatchingDirectory?.();
  stopWatchingDirectory = null;
  if (handleOutsideClick) {
    document.removeEventListener("mousedown", handleOutsideClick);
    handleOutsideClick = null;
  }
  cleanupAppAction?.();
  cleanupAppAction = null;
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

function loadRecentDirectories() {
  if (typeof localStorage === "undefined") return;
  try {
    const stored = localStorage.getItem(RECENT_STORAGE_KEY);
    recentDirectories.value = stored ? JSON.parse(stored) : [];
  } catch {
    recentDirectories.value = [];
  }
}

function saveRecentDirectories() {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(RECENT_STORAGE_KEY, JSON.stringify(recentDirectories.value));
}

function trackRecentDirectory(path: string, name: string) {
  if (!path) return;
  const entries = recentDirectories.value.filter((entry) => entry.path !== path);
  entries.unshift({ path, name });
  recentDirectories.value = entries.slice(0, 10);
  saveRecentDirectories();
}

async function openRecent(entry: RecentEntry) {
  await activateDirectory(entry);
}

function loadCustomDirectories() {
  if (typeof localStorage === "undefined") return;
  try {
    const stored = localStorage.getItem(CUSTOM_STORAGE_KEY);
    customEntries.value = stored ? JSON.parse(stored) : [];
  } catch {
    customEntries.value = [];
  }
  syncCustomNodes();
}

function saveCustomDirectories() {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(CUSTOM_STORAGE_KEY, JSON.stringify(customEntries.value));
}

function syncCustomNodes() {
  customRoots.value = customEntries.value.map((entry) =>
    createNode({
      path: entry.path,
      name: entry.name,
      depth: 0,
      type: "custom",
      favoriteId: undefined,
      register: true,
      reuseExisting: true,
    })
  );
  customRoots.value.forEach((node) => {
    const entry = customEntries.value.find((item) => item.path === node.path);
    if (entry) {
      node.customId = entry.id;
    }
  });
}

async function addCustomDirectory() {
  const directory = await window.electron?.selectDirectory?.({ title: "添加自定义目录" });
  if (!directory) return;
  const name = extractName(directory);
  const id = crypto.randomUUID?.() ?? `${Date.now()}`;
  customEntries.value = [{ id, path: directory, name }, ...customEntries.value.filter((entry) => entry.path !== directory)];
  saveCustomDirectories();
  syncCustomNodes();
}

function removeCustomDirectory(id?: string) {
  if (!id) return;
  customEntries.value = customEntries.value.filter((entry) => entry.id !== id);
  saveCustomDirectories();
  syncCustomNodes();
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
  await activateDirectory(node);
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

type DirectoryTarget = SidebarNode | { path: string; name: string };

function isSidebarNode(target: DirectoryTarget): target is SidebarNode {
  return typeof (target as SidebarNode).depth === "number";
}

async function activateDirectory(target: DirectoryTarget) {
  const path = target.path;
  const label = target.name;
  if (!path) return;
  activeNodePath.value = path;
  await loadImagesForDirectory(path);
  subscribeDirectoryWatcher(path);
  trackRecentDirectory(path, label);
  if (!isSidebarNode(target)) {
    ensureVirtualNode(path, label);
  }
}

function ensureVirtualNode(path: string, name: string) {
  if (!nodeRegistry.has(path)) {
    createNode({
      path,
      name,
      depth: 0,
      type: "history",
      register: true,
      reuseExisting: true,
    });
  }
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

watch(hasSelection, (value) => {
  if (!value) {
    closeActionsMenu();
  }
});

watch(hasImages, (value) => {
  if (!value) {
    closeSortMenu();
  }
});

watch(lightboxVisible, (value) => {
  if (!value) {
    closeViewerMenu();
  }
});

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
  const node =
    nodeRegistry.get(result.directory) ??
    findNodeByPath(result.directory, favoriteRoots.value);
  if (node) {
    await selectNode(node);
  } else {
    await activateDirectory({
      path: result.directory,
      name: extractName(result.directory),
    });
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
  if (key === "escape") {
    if (actionsMenuOpen.value || sortMenuOpen.value || viewerMenuOpen.value) {
      closeActionsMenu();
      closeSortMenu();
      closeViewerMenu();
      return;
    }
  }
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
  const padding = Math.max(80, Math.min(rect.width, rect.height) * 0.25);
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

function toggleActionsMenu() {
  if (!hasSelection.value) return;
  if (sortMenuOpen.value) {
    closeSortMenu();
  }
  actionsMenuOpen.value = !actionsMenuOpen.value;
}

function closeActionsMenu() {
  actionsMenuOpen.value = false;
}

function runAndClose(action: () => void | Promise<void>) {
  action();
  closeActionsMenu();
}

function toggleSortMenu() {
  if (!hasImages.value) return;
  if (actionsMenuOpen.value) {
    closeActionsMenu();
  }
  if (viewerMenuOpen.value) {
    closeViewerMenu();
  }
  sortMenuOpen.value = !sortMenuOpen.value;
}

function closeSortMenu() {
  sortMenuOpen.value = false;
}

function selectSort(mode: SortMode) {
  sortMode.value = mode;
  closeSortMenu();
}

function toggleViewerMenu() {
  if (!lightboxVisible.value) return;
  if (actionsMenuOpen.value) {
    closeActionsMenu();
  }
  if (sortMenuOpen.value) {
    closeSortMenu();
  }
  viewerMenuOpen.value = !viewerMenuOpen.value;
}

function closeViewerMenu() {
  viewerMenuOpen.value = false;
}

function runViewerAction(fn: () => void) {
  fn();
  closeViewerMenu();
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
  --viewer-pad: clamp(18px, 4vw, 48px);
  height: 100vh;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 0 var(--viewer-pad) 20px;
  color: var(--color-text);
  background: linear-gradient(180deg, #fefefe 0%, #f1f3f8 38%, #e7ebf3 100%);
  box-sizing: border-box;
  overflow: hidden;
  font-family: "SF Pro Text", "SF Pro Display", -apple-system, BlinkMacSystemFont,
    "Segoe UI", sans-serif;
}

.viewer-body {
  flex: 1;
  display: flex;
  gap: 18px;
  min-height: 0;
  padding-top: 12px;
}

.viewer-unified-toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 6px 20px 8px;
  border-radius: 0 0 14px 14px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-top: none;
  background: rgba(248, 249, 252, 0.9);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.85),
    0 10px 25px rgba(15, 23, 42, 0.08);
  position: sticky;
  top: 0;
  z-index: 25;
  margin-inline: calc(var(--viewer-pad) * -1);
  width: calc(100% + var(--viewer-pad) * 2);
  -webkit-app-region: drag;
  backdrop-filter: blur(28px) saturate(180%);
}

.toolbar-traffic-space {
  width: 72px;
  height: 32px;
  flex: 0 0 72px;
  -webkit-app-region: drag;
  pointer-events: none;
}

.toolbar-section {
  display: flex;
  align-items: center;
  gap: 12px;
}

.toolbar-section--left {
  flex: 0 0 auto;
}

.toolbar-section--center {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 10px;
  justify-content: flex-start;
  flex-wrap: wrap;
}

.toolbar-section--right {
  flex: 0 0 auto;
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 10px;
}

.viewer-sidebar {
  width: 260px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  padding: 18px 12px;
  border-radius: 18px;
  border: 1px solid rgba(120, 130, 150, 0.08);
  background: linear-gradient(180deg, rgba(248, 249, 252, 0.72), rgba(244, 246, 250, 0.82));
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.7), 0 25px 60px rgba(15, 23, 42, 0.08);
  backdrop-filter: blur(28px) saturate(160%);
}

.sidebar-utility {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 6px 8px;
  border-bottom: 1px solid rgba(120, 130, 150, 0.08);
  margin-bottom: 10px;
}

.sidebar-utility__btn {
  width: 30px;
  height: 30px;
  border-radius: 10px;
  border: 1px solid rgba(80, 90, 110, 0.18);
  background: rgba(255, 255, 255, 0.85);
  color: #1f2430;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.2s ease, border-color 0.2s ease;
}

.sidebar-utility__btn svg {
  width: 18px;
  height: 18px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.4;
  vector-effect: non-scaling-stroke;
}

.sidebar-utility__btn:not(:disabled):hover {
  border-color: rgba(60, 110, 255, 0.5);
  background: rgba(255, 255, 255, 1);
}

.sidebar-utility__btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.sidebar-groups {
  flex: 1;
  overflow-y: auto;
  padding-right: 4px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.sidebar-group__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 8px 6px;
}

.sidebar-group__label {
  font-size: 11px;
  letter-spacing: 0.25em;
  text-transform: uppercase;
  color: rgba(60, 60, 67, 0.55);
  border: none;
  background: transparent;
  padding: 0;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  -webkit-app-region: no-drag;
}

.sidebar-group__chevron {
  width: 12px;
  height: 12px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  transform: rotate(-90deg);
  transition: transform 0.15s ease;
}

.sidebar-group__chevron.open {
  transform: rotate(0deg);
}

.sidebar-header-btn {
  width: 24px;
  height: 24px;
  border-radius: 7px;
  border: none;
  background: transparent;
  color: rgba(52, 61, 78, 0.9);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.2s ease;
}

.sidebar-header-btn svg {
  width: 16px;
  height: 16px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.6;
}

.sidebar-header-btn:hover {
  background: rgba(90, 140, 255, 0.14);
  color: #0a84ff;
}

.sidebar-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.sidebar-list__item {
  width: 100%;
}

.sidebar-item-row {
  display: flex;
  align-items: center;
  gap: 4px;
  padding-left: calc(var(--sidebar-indent, 0) + 4px);
}

.sidebar-item__toggle {
  border: none;
  background: transparent;
  color: rgba(60, 60, 67, 0.45);
  width: 22px;
  height: 22px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  -webkit-app-region: no-drag;
}

.sidebar-item__toggle svg {
  width: 12px;
  height: 12px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  transform: rotate(-90deg);
  transition: transform 0.15s ease;
}

.sidebar-item__toggle + .sidebar-item {
  margin-left: -6px;
}

.sidebar-item__toggle.open svg {
  transform: rotate(0deg);
}

.sidebar-item {
  flex: 1;
  height: 30px;
  border: none;
  background: transparent;
  border-radius: 8px;
  padding: 0 10px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #1f1f25;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
  -webkit-app-region: no-drag;
}

.sidebar-item:hover {
  background: rgba(0, 0, 0, 0.04);
}

.sidebar-item.is-active {
  background: rgba(10, 132, 255, 0.18);
  color: #0a84ff;
}

.sidebar-item.is-drop-target {
  background: rgba(66, 165, 245, 0.15);
  color: #2563eb;
}

.sidebar-item__icon {
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: inherit;
}

.sidebar-item__icon svg {
  width: 18px;
  height: 18px;
}

.sidebar-item__icon svg path {
  fill: currentColor;
  stroke: none;
}

.sidebar-item__name {
  flex: 1;
  text-align: left;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sidebar-item__action {
  border: none;
  background: transparent;
  color: rgba(60, 60, 67, 0.5);
  width: 22px;
  height: 22px;
  border-radius: 6px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease;
}

.sidebar-item__action svg {
  width: 16px;
  height: 16px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.5;
}

.sidebar-item__action:hover {
  background: rgba(10, 132, 255, 0.1);
  color: #0a84ff;
}

.sidebar-empty {
  margin: 6px 0 0 8px;
  font-size: 12px;
  color: rgba(60, 60, 67, 0.4);
}

.viewer-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: 0;
}

.toolbar-interactive {
  -webkit-app-region: no-drag;
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

.toolbar-selection--dropdown {
  gap: 12px;
}

.toolbar-dropdown {
  position: relative;
}

.toolbar-dropdown--sort {
  margin-right: 8px;
}

.toolbar-dropdown.is-open .toolbar-dropdown__trigger {
  background: rgba(92, 107, 192, 0.16);
  border-color: rgba(92, 107, 192, 0.4);
}

.toolbar-dropdown__trigger {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: 1px solid rgba(60, 60, 67, 0.2);
  border-radius: 8px;
  padding: 6px 12px;
  background: rgba(255, 255, 255, 0.9);
  color: var(--color-text);
  cursor: pointer;
  font-size: 13px;
  letter-spacing: 0.04em;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.6);
}

.toolbar-dropdown__trigger--icon {
  width: 34px;
  height: 34px;
  padding: 0;
  justify-content: center;
  font-size: 16px;
}

.toolbar-dropdown__trigger:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.toolbar-dropdown__chevron {
  font-size: 12px;
  color: rgba(60, 60, 67, 0.6);
}

.toolbar-dropdown__menu {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  min-width: 190px;
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  background: rgba(255, 255, 255, 0.97);
  box-shadow: 0 20px 40px rgba(15, 23, 42, 0.18),
    inset 0 1px 0 rgba(255, 255, 255, 0.9);
  padding: 6px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  z-index: 40;
}

.toolbar-dropdown__item {
  border: none;
  background: transparent;
  border-radius: 8px;
  padding: 6px 10px;
  text-align: left;
  font-size: 13px;
  color: #1c1c1e;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: background 0.2s ease, color 0.2s ease;
}

.toolbar-dropdown__item:not(:disabled):hover {
  background: rgba(92, 107, 192, 0.12);
}

.toolbar-dropdown__item:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.toolbar-dropdown__item--danger:not(:disabled):hover {
  background: rgba(255, 76, 58, 0.15);
  color: #d7263d;
}

.toolbar-dropdown__check {
  width: 16px;
  text-align: center;
  font-size: 12px;
  color: #0a84ff;
}

.toolbar-dropdown__label {
  flex: 1;
  text-align: left;
}

.toolbar-dropdown__icon {
  width: 20px;
  height: 20px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.toolbar-dropdown__icon svg {
  width: 18px;
  height: 18px;
  fill: currentColor;
}

.viewer-sidebar__card {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 14px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.78);
  border: 1px solid rgba(0, 0, 0, 0.04);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.8);
  width: 100%;
  box-sizing: border-box;
}

.viewer-sidebar__card--tree {
  padding: 16px;
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

.sidebar-card__actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
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
  border-radius: 8px;
  padding: 0 4px;
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
  border-color: rgba(92, 107, 192, 0.35);
  background: rgba(92, 107, 192, 0.18);
  box-shadow: inset 0 0 0 1px rgba(92, 107, 192, 0.15);
}

.directory-tree__main.is-drop-target {
  border-color: rgba(66, 165, 245, 0.6);
  background: rgba(66, 165, 245, 0.18);
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
  border-color: rgba(82, 141, 255, 0.6);
  background: linear-gradient(
    180deg,
    rgba(141, 175, 255, 0.35),
    rgba(89, 136, 255, 0.25)
  );
  box-shadow: 0 6px 18px rgba(80, 120, 255, 0.28);
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
  border-color: rgba(10, 132, 255, 0.75);
  background: rgba(10, 132, 255, 0.16);
  box-shadow: 0 4px 18px rgba(10, 132, 255, 0.4);
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

.viewer-toolbar__select {
  background: transparent;
  border: 1px solid var(--color-divider);
  color: var(--color-text);
  border-radius: 10px;
  padding: 4px 14px;
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

.viewer-lightbox__canvas--forward :deep(.image-wrapper) {
  animation: viewer-slide-forward 220ms ease;
}

.viewer-lightbox__canvas--backward :deep(.image-wrapper) {
  animation: viewer-slide-backward 220ms ease;
}

.viewer-lightbox__canvas--none :deep(.image-wrapper) {
  animation: viewer-fade-in 220ms ease;
}

.viewer-lightbox__nav {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 48px;
  height: 88px;
  border: none;
  border-radius: 24px;
  background: rgba(12, 18, 30, 0.35);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.2s ease, opacity 0.2s ease;
  backdrop-filter: blur(14px);
}

.viewer-lightbox__nav svg {
  width: 18px;
  height: 18px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
}

.viewer-lightbox__nav--prev {
  left: 10px;
  transform: translateY(-50%) rotate(180deg);
}

.viewer-lightbox__nav--next {
  right: 10px;
}

.viewer-lightbox__nav:hover:not(:disabled) {
  background: rgba(12, 18, 30, 0.55);
}

.viewer-lightbox__nav:disabled {
  opacity: 0.15;
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
  border-color: rgba(82, 141, 255, 0.65);
  background: linear-gradient(
    180deg,
    rgba(141, 175, 255, 0.35),
    rgba(89, 136, 255, 0.25)
  );
  box-shadow: 0 8px 24px rgba(82, 141, 255, 0.32);
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

.viewer-toolbar__select {
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
</style>
