<template>
  <div class="viewer" :class="{ 'viewer--narrow': isNarrowLayout }">
    <header class="viewer-unified-toolbar">
      <div class="toolbar-traffic-space" aria-hidden="true"></div>
      <div class="toolbar-content">
        <div class="toolbar-left">
          <button
            type="button"
            class="toolbar-sidebar-toggle toolbar-interactive"
            :class="{ 'is-collapsed': isSidebarCollapsed }"
            aria-label="切换侧边栏"
            @click="toggleSidebar">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path :d="SIDEBAR_ICONS.chevron" />
            </svg>
          </button>
          <div class="toolbar-title">
            <span class="toolbar-title__primary">助眠神器</span>
            <span class="toolbar-title__path" :title="currentDirectoryLabel">
              {{ currentDirectoryLabel }}
            </span>
          </div>
        </div>
        <div class="toolbar-spacer"></div>

        <div class="toolbar-actions">
          <div class="toolbar-icon-group">
            <button
              class="toolbar-button toolbar-interactive"
              title="打开目录 (⌘O)"
              @click="openDirectoryPicker">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path :d="TOOLBAR_ICONS.open" />
              </svg>
            </button>
            <button
              class="toolbar-button toolbar-interactive"
              title="刷新目录"
              @click="bootstrapSidebar">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path :d="TOOLBAR_ICONS.refresh" />
              </svg>
            </button>
          </div>

          <div
            class="toolbar-dropdown toolbar-dropdown--icon toolbar-interactive"
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
            <div v-if="sortMenuOpen" class="toolbar-dropdown__menu" role="menu">
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

          <div class="toolbar-icon-group toolbar-view-mode">
            <button
              class="toolbar-button toolbar-interactive"
              :class="{ 'is-active': viewMode === 'regular' }"
              title="标准视图"
              :aria-pressed="viewMode === 'regular'"
              @click="setViewMode('regular')">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path :d="TOOLBAR_ICONS.viewRegular" />
              </svg>
            </button>
            <button
              class="toolbar-button toolbar-interactive"
              :class="{ 'is-active': viewMode === 'compact' }"
              title="紧凑视图"
              :aria-pressed="viewMode === 'compact'"
              @click="setViewMode('compact')">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path :d="TOOLBAR_ICONS.viewCompact" />
              </svg>
            </button>
          </div>

          <div class="toolbar-icon-group">
            <button
              class="toolbar-button toolbar-interactive"
              :disabled="!psdGroups.length"
              title="管理当前目录中的 PSD 标记"
              @click="openPsdManager">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path :d="TOOLBAR_ICONS.psdManager" />
              </svg>
            </button>
          </div>

          <div
            class="toolbar-dropdown toolbar-dropdown--icon"
            :class="{ 'is-open': themeMenuOpen }"
            ref="themeMenuRef">
            <button
              class="toolbar-dropdown__trigger toolbar-dropdown__trigger--icon toolbar-interactive"
              title="主题模式"
              aria-label="主题模式"
              @click="toggleThemeMenu">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path :d="TOOLBAR_ICONS.theme" />
              </svg>
            </button>
            <div
              v-if="themeMenuOpen"
              class="toolbar-dropdown__menu"
              role="menu">
              <button
                v-for="option in themeOptions"
                :key="option.value"
                class="toolbar-dropdown__item"
                role="menuitemradio"
                :aria-checked="themePreference === option.value"
                @click="() => selectThemePreference(option.value)">
                <span class="toolbar-dropdown__check">
                  {{ themePreference === option.value ? "✓" : "" }}
                </span>
                <span class="toolbar-dropdown__label">{{ option.label }}</span>
              </button>
            </div>
          </div>

          <div v-if="isRatingCollectionView" class="toolbar-rating-filter">
            <span class="toolbar-rating-filter__label">星级筛选：</span>
            <div class="toolbar-rating-filter__stars">
              <button
                v-for="rating in [5, 4, 3, 2, 1]"
                :key="rating"
                class="toolbar-rating-filter__star"
                :class="{ 'is-active': isRatingFiltered(rating) }"
                :title="`${rating} 星 (${getRatingCount(rating)} 张)`"
                @click="toggleRatingFilter(rating)">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path :d="SIDEBAR_ICONS.star" />
                </svg>
                <span class="toolbar-rating-filter__value">{{ rating }}★</span>
                <span class="toolbar-rating-filter__count">{{
                  getRatingCount(rating)
                }}</span>
              </button>
            </div>
            <button
              v-if="selectedRatingFilters.size > 0"
              class="toolbar-rating-filter__clear"
              title="清除筛选"
              @click="clearRatingFilters">
              清除
            </button>
          </div>

          <div class="toolbar-search">
            <svg
              class="toolbar-search__icon"
              viewBox="0 0 24 24"
              aria-hidden="true">
              <path :d="TOOLBAR_ICONS.search" />
            </svg>
            <input
              v-model="searchQuery"
              class="toolbar-search__input"
              type="text"
              placeholder="搜索图片或目录"
              @keydown.stop />
            <button
              v-if="searchQuery"
              class="toolbar-search__clear"
              aria-label="清除搜索"
              @click="clearSearch">
              ×
            </button>
          </div>

          <div
            v-if="hasSelection"
            class="toolbar-dropdown toolbar-dropdown--actions toolbar-interactive"
            :class="{ 'is-open': actionsMenuOpen }"
            ref="actionsMenuRef">
            <button
              class="toolbar-dropdown__trigger toolbar-dropdown__trigger--icon toolbar-interactive"
              :title="`图片操作（已选 ${selectedCount} 张）`"
              aria-label="图片操作"
              @click="toggleActionsMenu">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path :d="TOOLBAR_ICONS.actions" />
              </svg>
            </button>
            <div
              v-if="actionsMenuOpen"
              class="toolbar-dropdown__menu"
              role="menu">
              <button
                class="toolbar-dropdown__item"
                role="menuitem"
                :disabled="!hasSelection"
                title="复制路径 (⌘/Ctrl + C)"
                @click="() => runAndClose(copySelectedPaths)">
                <span class="toolbar-dropdown__icon">
                  <svg viewBox="0 0 24 24">
                    <path :d="ACTION_ICONS.copyPaths" />
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
                    <path :d="ACTION_ICONS.reveal" />
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
                    <path :d="ACTION_ICONS.rename" />
                  </svg>
                </span>
                重命名
              </button>
              <button
                class="toolbar-dropdown__item"
                role="menuitem"
                :disabled="!hasSelection"
                title="复制到目录 (⌘/Ctrl + Shift + C)"
                @click="() => runAndClose(copySelectedToDirectory)">
                <span class="toolbar-dropdown__icon">
                  <svg viewBox="0 0 24 24">
                    <path :d="ACTION_ICONS.copyToDirectory" />
                  </svg>
                </span>
                复制到目录
              </button>
              <button
                class="toolbar-dropdown__item"
                role="menuitem"
                :disabled="!hasSelection"
                title="移动到目录 (⌘/Ctrl + Shift + M)"
                @click="() => runAndClose(moveSelectedToDirectory)">
                <span class="toolbar-dropdown__icon">
                  <svg viewBox="0 0 24 24">
                    <path :d="ACTION_ICONS.moveToDirectory" />
                  </svg>
                </span>
                移动到目录
              </button>
              <button
                class="toolbar-dropdown__item"
                role="menuitem"
                :disabled="!hasSelection"
                title="导出 (⌘/Ctrl + E)"
                @click="() => runAndClose(exportSelected)">
                <span class="toolbar-dropdown__icon">
                  <svg viewBox="0 0 24 24">
                    <path :d="ACTION_ICONS.export" />
                  </svg>
                </span>
                导出
              </button>
              <button
                class="toolbar-dropdown__item toolbar-dropdown__item--danger"
                role="menuitem"
                :disabled="!hasSelection"
                title="删除 (Delete / Backspace)"
                @click="() => runAndClose(deleteSelected)">
                <span class="toolbar-dropdown__icon">
                  <svg viewBox="0 0 24 24">
                    <path :d="ACTION_ICONS.delete" />
                  </svg>
                </span>
                删除
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>

    <div
      class="viewer-body"
      :class="{
        'viewer-body--narrow': isNarrowLayout,
        'viewer-body--sidebar-collapsed': isSidebarCollapsed,
      }">
      <aside
        class="viewer-sidebar"
        :class="{ 'viewer-sidebar--collapsed': isSidebarCollapsed }">
        <nav class="sidebar-groups sidebar-groups--flush">
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
                收藏目录
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
            <ul v-show="groupState.favorites" class="sidebar-list" role="list">
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
              <span class="sidebar-group__label">星级图片</span>
            </header>
            <ul class="sidebar-list" role="list">
              <li class="sidebar-list__item">
                <div class="sidebar-item-row">
                  <button
                    class="sidebar-item"
                    :class="{ 'is-active': isRatingCollectionView }"
                    @click="showAllRatedImages()">
                    <span class="sidebar-item__icon">
                      <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path :d="SIDEBAR_ICONS.star" />
                      </svg>
                    </span>
                    <span class="sidebar-item__name">所有星级</span>
                    <span class="sidebar-item__meta"
                      >{{ totalRatedCount }} 张</span
                    >
                  </button>
                </div>
              </li>
            </ul>
            <p v-if="!hasAnyRatedImages" class="sidebar-empty">
              尚未评级图片，可在缩略图上点击星标添加评级
            </p>
          </section>

          <section class="sidebar-group">
            <header class="sidebar-group__header">
              <button
                type="button"
                class="sidebar-group__label"
                @click="toggleGroup('external')">
                <svg
                  class="sidebar-group__chevron"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                  :class="{ open: groupState.external }">
                  <path :d="SIDEBAR_ICONS.chevron" />
                </svg>
                外接存储
              </button>
            </header>
            <ul v-show="groupState.external" class="sidebar-list" role="list">
              <li
                v-for="node in flattenedExternal"
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
                        <path
                          :d="
                            node.depth === 0 && node.type === 'external'
                              ? SIDEBAR_ICONS.drive
                              : SIDEBAR_ICONS.folder
                          "
                        />
                      </svg>
                    </span>
                    <span class="sidebar-item__name">{{ node.name }}</span>
                  </button>
                </div>
              </li>
            </ul>
            <p v-if="!flattenedExternal.length" class="sidebar-empty">
              未检测到外接存储
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
            <ul v-show="groupState.system" class="sidebar-list" role="list">
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
            <ul v-show="groupState.custom" class="sidebar-list" role="list">
              <li
                v-for="node in flattenedCustom"
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
                        <path
                          :d="
                            node.depth === 0 && node.type === 'custom'
                              ? SIDEBAR_ICONS.user
                              : SIDEBAR_ICONS.folder
                          "
                        />
                      </svg>
                    </span>
                    <span class="sidebar-item__name">{{ node.name }}</span>
                  </button>
                  <button
                    class="sidebar-item__action"
                    v-if="node.customId"
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
                  <img
                    :src="getThumbnailSrc(item.resource)"
                    :alt="item.name"
                    loading="lazy" />
                </div>
                <div class="viewer-gallery__actions">
                  <span
                    class="viewer-gallery__rating"
                    role="button"
                    tabindex="0"
                    :title="`当前评级: ${
                      getImageRating(item.path) || '未评级'
                    }`"
                    @click.stop="handleRatingClick($event, item)"
                    @keydown.enter.prevent.stop="
                      handleRatingClick($event, item)
                    "
                    @keydown.space.prevent.stop="
                      handleRatingClick($event, item)
                    ">
                    <span
                      v-for="star in [1, 2, 3, 4, 5]"
                      :key="star"
                      class="viewer-gallery__rating-star"
                      :class="{
                        'is-filled': getImageRating(item.path) && getImageRating(item.path)! >= star
                      }">
                      <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path :d="SIDEBAR_ICONS.star" />
                      </svg>
                    </span>
                  </span>
                </div>
                <p class="viewer-gallery__caption" :title="item.name">
                  <button
                    v-if="item.extension === 'psd'"
                    type="button"
                    class="psd-tag"
                    :class="{ 'psd-tag--active': isPsdEdited(item.path) }"
                    :title="isPsdEdited(item.path) ? '标记为未修' : '标记为已修'"
                    @click.stop="togglePsdEdited(item.path)">
                    {{ isPsdEdited(item.path) ? "已修" : "未修" }}
                  </button>
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

    <div v-if="psdManagerOpen" class="psd-manager">
      <div class="psd-manager__header">
        <h2 class="psd-manager__title">PSD 标记管理</h2>
        <button
          type="button"
          class="psd-manager__close"
          title="关闭"
          @click="closePsdManager">
          ×
        </button>
      </div>
      <div class="psd-manager__body">
        <p v-if="!psdGroups.length" class="psd-manager__empty">
          当前目录中未检测到 PSD 文件。
        </p>
        <p v-else-if="!pendingPsdGroups.length" class="psd-manager__empty">
          当前目录中的 PSD 已全部标记完成。
        </p>
        <ul v-else class="psd-manager__list">
          <li
            v-for="group in pendingPsdGroups"
            :key="group.psd.path"
            class="psd-manager__item">
            <div class="psd-manager__main">
              <span class="psd-manager__name">{{ group.psd.path }}</span>
              <span class="psd-manager__badge">待标记</span>
            </div>
            <div class="psd-manager__meta">
              <span class="psd-manager__label">同名变体：</span>
              <span v-if="!group.others.length" class="psd-manager__label-muted">
                无
              </span>
              <span
                v-else
                class="psd-manager__variant"
                v-for="other in group.others"
                :key="other.path">
                {{ other.extension.toUpperCase() }}
              </span>
            </div>
            <button
              type="button"
              class="psd-manager__action"
              @click="togglePsdEdited(group.psd.path)">
              标记为已修
            </button>
          </li>
        </ul>
      </div>
    </div>

    <div v-if="lightboxVisible" class="viewer-lightbox">
      <div class="viewer-lightbox__backdrop" @click="closeLightbox"></div>
      <div class="viewer-lightbox__content">
        <div class="viewer-lightbox__chrome">
          <div class="viewer-lightbox__info">
            <p class="viewer-lightbox__status">{{ statusText }}</p>
            <p v-if="currentFileName" class="viewer-lightbox__title">
              {{ currentFileName }}
            </p>
            <p v-if="currentMetadata" class="viewer-lightbox__subtext">
              {{ formatFileSize(currentMetadata.size) }} ·
              {{ formatDate(currentMetadata.modifiedAt) }}
            </p>
          </div>
          <div class="viewer-lightbox__header-actions">
            <div class="viewer-lightbox__controls">
              <button
                class="viewer-lightbox__toolbar-btn"
                title="放大 (⌘+)"
                @click="runViewerAction(zoomIn)">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path :d="TOOLBAR_ICONS.zoomIn" />
                </svg>
              </button>
              <button
                class="viewer-lightbox__toolbar-btn"
                title="缩小 (⌘-)"
                @click="runViewerAction(zoomOut)">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path :d="TOOLBAR_ICONS.zoomOut" />
                </svg>
              </button>
              <button
                class="viewer-lightbox__toolbar-btn"
                title="适应窗口 (0)"
                @click="runViewerAction(resetLightboxView)">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path :d="TOOLBAR_ICONS.reset" />
                </svg>
              </button>
              <button
                class="viewer-lightbox__toolbar-btn"
                title="旋转 90° (R)"
                @click="runViewerAction(rotate)">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path :d="TOOLBAR_ICONS.rotate" />
                </svg>
              </button>
              <button
                class="viewer-lightbox__toolbar-btn"
                title="水平翻转"
                @click="runViewerAction(toggleFlipX)">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path :d="TOOLBAR_ICONS.flipX" />
                </svg>
              </button>
              <button
                class="viewer-lightbox__toolbar-btn"
                title="垂直翻转"
                @click="runViewerAction(toggleFlipY)">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path :d="TOOLBAR_ICONS.flipY" />
                </svg>
              </button>
              <button
                class="viewer-lightbox__toolbar-btn"
                :title="playing ? '暂停幻灯片' : '播放幻灯片'"
                @click="runViewerAction(toggleSlideshow)">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    :d="playing ? TOOLBAR_ICONS.pause : TOOLBAR_ICONS.play" />
                </svg>
              </button>
              <button
                class="viewer-lightbox__toolbar-btn"
                title="全屏切换"
                @click="runViewerAction(toggleFullscreen)">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path :d="TOOLBAR_ICONS.fullscreen" />
                </svg>
              </button>
            </div>
            <div class="viewer-lightbox__rating">
              <span
                v-for="star in [1, 2, 3, 4, 5]"
                :key="star"
                class="viewer-lightbox__rating-star"
                :class="{
                  'is-filled': currentGalleryItem && getImageRating(currentGalleryItem.path) && getImageRating(currentGalleryItem.path)! >= star
                }"
                :title="`设置为 ${star} 星`"
                @click="handleLightboxRatingClick(star)">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path :d="SIDEBAR_ICONS.star" />
                </svg>
              </span>
            </div>
            <button
              class="viewer-lightbox__toolbar-btn viewer-lightbox__toolbar-btn--close"
              title="关闭 (Esc)"
              @click="closeLightbox">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path :d="SIDEBAR_ICONS.close" />
              </svg>
            </button>
          </div>
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
import { useSystemTheme } from "../composables/useSystemTheme";
import { usePsdMetadata } from "../composables/usePsdMetadata";
import { ALL_IMAGE_EXTENSIONS } from "@app/main/src/constants/imageExtensions";
import type { ThemeMode, ThemePreference } from "../types/theme";
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  reactive,
  ref,
  watch,
} from "vue";

type SidebarNodeType =
  | "system"
  | "favorite"
  | "external"
  | "directory"
  | "custom"
  | "history";

type SidebarNode = {
  path: string;
  name: string;
  depth: number;
  type: SidebarNodeType;
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
  star: "M12 4.5l2.5 4.9 5.4.8-3.9 3.8.9 5.5L12 16.8l-4.9 2.7.9-5.5-3.9-3.8 5.4-.8z",
  clock:
    "M12 4a8 8 0 1 1 0 16 8 8 0 0 1 0-16zm-.75 3.5v5.25L15 15.2l-.75 1.3-4.5-2.6V7.5z",
  user: "M12 6a3 3 0 1 1 0 6 3 3 0 0 1 0-6zm0 7.5c3.2 0 5.5 1.7 5.5 3.6V18H6.5v-.9c0-1.9 2.3-3.6 5.5-3.6z",
  plus: "M12 5v6H6v2h6v6h2v-6h6v-2h-6V5z",
  refresh:
    "M12 4a8 8 0 0 1 7.9 7.1H22l-3.3 3.9L15.5 11h2.1A6 6 0 1 0 18 13h2a8 8 0 1 1-8-9z",
  drive:
    "M4 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2zm2 0v7h12V7H6zm2 9h8v2H8z",
  chevron: "M9 6l6 6-6 6",
  close: "M8.5 8.5l6.9 6.9m0-6.9-6.9 6.9",
};
const TOOLBAR_ICONS = {
  viewer: "M5 7h14l2 2v9l-2 2H5l-2-2V9z M7.5 5h9l1.5 2m-11 0h9",
  sort: "M5 7h14M5 12h10M5 17h7",
  open: "M5 6h5.2l1.6 2H19a1 1 0 0 1 1 1v9H4V7a1 1 0 0 1 1-1zm-1 12h16v2H4z",
  refresh:
    "M12 5a7 7 0 0 1 6.9 6H21l-3.5 3.5L14 11h2.2A5 5 0 1 0 17 13h2a7 7 0 1 1-7-8z",
  actions:
    "M7 12a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm5 0a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm5 0a1 1 0 1 1 0-2 1 1 0 0 1 0 2z",
  viewRegular: "M5 7h5v5H5zM14 7h5v5h-5zM5 14h5v5H5zM14 14h5v5h-5z",
  viewCompact: "M5 9h14M5 15h14",
  search: "M11 5a6 6 0 1 1 0 12 6 6 0 0 1 0-12zm7 12 3 3",
  theme: "M12 4a4 4 0 1 0 0 8 6 6 0 1 1 0 8 8 8 0 1 1 0-16z",
  recent: SIDEBAR_ICONS.clock,
  zoomIn:
    "M11 4a7 7 0 1 1 0 14 7 7 0 0 1 0-14zm0 2a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm-.75 2.5h1.5v1.75H13.5v1.5h-1.75V13.5h-1.5v-1.75H8.5v-1.5h1.75V8.5zM18.5 18.5l3 3-1.5 1.5-3-3z",
  zoomOut:
    "M11 4a7 7 0 1 1 0 14 7 7 0 0 1 0-14zm0 2a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm-2.5 4.25h5v1.5h-5zM18.5 18.5l3 3-1.5 1.5-3-3z",
  reset: "M12 5a7 7 0 1 1-6.8 5.3l2 0.4A5 5 0 1 0 12 7v2.5L8 6l4-3.5z",
  rotate:
    "M12 4a6 6 0 0 1 5.8 7.4l-1.9-.5A4 4 0 0 0 12 6v2L7.5 4.5 12 1v3zM6 12a6 6 0 0 0 9.5 4.9l1.1 1.6A8 8 0 1 1 6 5.1L7.2 6.7A6 6 0 0 0 6 12z",
  flipX: "M5 6h14v2H5zm0 10h14v2H5zM7 9h2v6H7zm4 0h2v6h-2zm4 0h2v6h-2z",
  flipY: "M6 5h2v14H6zm10 0h2v14h-2zM9 7h6v2H9zm0 4h6v2H9zm0 4h6v2H9z",
  play: "M8.5 6.5l8 5.5-8 5.5v-11zM5 6h2v12H5z",
  pause: "M7 6h3v12H7zm7 0h3v12h-3z",
  fullscreen:
    "M6 6h5v2H8v3H6zm10 0v5h-2V8h-3V6zm-3 10h3v-3h2v5h-5zm-4 0v2H6v-5h2v3z",
  psdManager:
    "M5 7h14v10a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1zM7 5h6v2H7zm3 4h6v2h-6zm0 3h4v2h-4z",
};
const ACTION_ICONS = {
  copyPaths:
    "M8 6h8a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2zm-3 3h3m-3 4h3m-3 4h3",
  reveal:
    "M12 5a7 7 0 1 1 0 14 7 7 0 0 1 0-14zm0 2.5a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9zm2 1.5 3.5 3.5",
  rename: "M6 17.5V20h2.5l9.2-9.2-2.5-2.5zm10.1-10.1 3-3 1.5 1.5-3 3z",
  copyToDirectory: "M7 9h10a2 2 0 0 1 2 2v7H7V9zm0 0v12m5-8 3-3m-3 3 3 3",
  moveToDirectory:
    "M7 9h11a1.5 1.5 0 0 1 1.5 1.5V18a1.5 1.5 0 0 1-1.5 1.5H7zm5 0v12",
  export: "M7 12l4-4 4 4m-4-4v11m-5 0h10",
  delete: "M9 7h6l1.5 2h3v2H4.5V9h3z M9 11v7m6-7v7",
};
type RecentEntry = { path: string; name: string };
type CustomEntry = { id: string; path: string; name: string };
type FavoriteEntry = {
  id: string;
  name: string;
  path: string;
  addedAt: number;
  rating?: number;
  kind?: "favorite" | "rating";
};
type DirectorySnapshot = {
  items: Array<{
    path: string;
    size: number;
    modifiedAt: number;
  }>;
};

type ViewMode = "regular" | "compact";
const imageList = ref<GalleryItem[]>([]);
const currentIndex = ref(0);
const viewMode = ref<ViewMode>("regular");
const VIEW_MODE_SIZES: Record<ViewMode, number> = {
  regular: 128,
  compact: 96,
};
const searchQuery = ref("");
const sortMode = ref<SortMode>("name-asc");
const activeNodePath = ref("");
const lightboxVisible = ref(false);
const lightboxDirection = ref<"none" | "forward" | "backward">("none");
const systemRoots = ref<SidebarNode[]>([]);
const favoriteRoots = ref<SidebarNode[]>([]);
const externalRoots = ref<SidebarNode[]>([]);
const nodeRegistry = reactive(new Map<string, SidebarNode>());
const selectedIndexes = ref<Set<number>>(new Set());
const lastSelectedIndex = ref<number | null>(null);
const dragPayload = reactive({
  indexes: [] as number[],
  sourcePath: "",
});
const dragOverPath = ref<string | null>(null);
const RATING_COLLECTION_PATH = "__ratings__";
const RATING_COLLECTION_LABEL = "星级图片";
const RECENT_STORAGE_KEY = "photon:recent-directories";
const CUSTOM_STORAGE_KEY = "photon:sidebar:custom";
const DRAG_MIME_TYPE = "application/x-photon-gallery";
const SUPPORTED_IMAGE_EXTENSIONS = new Set(
  ALL_IMAGE_EXTENSIONS.map((ext: string) => ext.toLowerCase())
);
const selectedRatingFilters = ref<Set<number>>(new Set());
const ratedImages = ref<Map<string, number>>(new Map());
const allFavoriteEntries = ref<FavoriteEntry[]>([]);
const toasts = ref<ToastMessage[]>([]);
const toastTimers = new Map<number, ReturnType<typeof window.setTimeout>>();
let toastSeed = 0;
const MAX_BOOTSTRAP_RETRY = 3;
const BOOTSTRAP_RETRY_DELAY = 600;
let bootstrapRetryCount = 0;
let bootstrapRetryTimer: ReturnType<typeof window.setTimeout> | null = null;
const actionsMenuOpen = ref(false);
const actionsMenuRef = ref<HTMLElement | null>(null);
const sortMenuOpen = ref(false);
const sortMenuRef = ref<HTMLElement | null>(null);
const recentDirectories = ref<RecentEntry[]>([]);
const customEntries = ref<CustomEntry[]>([]);
const customRoots = ref<SidebarNode[]>([]);
const isRatingCollectionView = computed(
  () => activeNodePath.value === RATING_COLLECTION_PATH
);
const totalRatedCount = computed(() => ratedImages.value.size);
const groupState = reactive({
  favorites: true,
  external: true,
  system: true,
  custom: true,
});
const toggleGroup = (key: keyof typeof groupState) => {
  groupState[key] = !groupState[key];
};
const { isEdited: isPsdEdited, loadFromGroups: loadPsdGroups, toggleEdited: togglePsdEdited } =
  usePsdMetadata();
const psdGroups = ref<PsdGroup[]>([]);
const psdManagerOpen = ref(false);
const pendingPsdGroups = computed(() =>
  psdGroups.value.filter((group) => !isPsdEdited(group.psd.path))
);
const isMacPlatform =
  typeof navigator !== "undefined" && /Mac/i.test(navigator.platform);
const SIDEBAR_BREAKPOINT = 900;
const isNarrowLayout = ref(false);
const isSidebarCollapsed = ref(false);
const viewerMenuOpen = ref(false);
const viewerMenuRef = ref<HTMLElement | null>(null);
const themeMenuOpen = ref(false);
const themeMenuRef = ref<HTMLElement | null>(null);
const sortOptions: Array<{ value: SortMode; label: string }> = [
  { value: "name-asc", label: "名称 A→Z" },
  { value: "name-desc", label: "名称 Z→A" },
  { value: "modified-desc", label: "最近修改" },
  { value: "size-desc", label: "文件大小" },
];
const themeOptions: Array<{ value: ThemePreference; label: string }> = [
  { value: "auto", label: "自动" },
  { value: "light", label: "浅色" },
  { value: "dark", label: "深色" },
];
const { setTheme, getTheme, subscribe: subscribeTheme } = useSystemTheme();
const themePreference = ref<ThemePreference>(getTheme().preference);
const themeMode = ref<ThemeMode>(getTheme().mode);

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

  // 如果在星级视图中，按星级从高到低排序
  if (isRatingCollectionView.value) {
    return items.sort((a, b) => {
      const ratingA = ratedImages.value.get(a.path) || 0;
      const ratingB = ratedImages.value.get(b.path) || 0;
      if (ratingB !== ratingA) {
        return ratingB - ratingA; // 星级高的在前
      }
      // 同星级按名称排序
      return a.name.localeCompare(b.name, undefined, { numeric: true });
    });
  }

  // 普通目录视图的排序
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
  let items = sortedItems.value;

  // 星级筛选（支持多选）- 只在星级视图时生效
  if (isRatingCollectionView.value && selectedRatingFilters.value.size > 0) {
    items = items.filter((item) => {
      const rating = ratedImages.value.get(item.path);
      return rating !== undefined && selectedRatingFilters.value.has(rating);
    });
  }

  // 搜索筛选
  const query = searchQuery.value.trim().toLowerCase();
  if (query) {
    const nodeName = currentNode.value?.name?.toLowerCase() ?? "";
    items = items.filter(
      (item) =>
        item.name.toLowerCase().includes(query) ||
        nodeName.includes(query) ||
        getDirectoryFromPath(item.path).toLowerCase().includes(query)
    );
  }

  return items;
});

const hasImages = computed(() => galleryItems.value.length > 0);
const canPlaySlideshow = computed(() => galleryItems.value.length > 1);
const currentImage = computed(
  () => galleryItems.value[currentIndex.value]?.resource ?? ""
);
const currentMetadata = computed(() => galleryItems.value[currentIndex.value]);
const currentGalleryItem = computed(
  () => galleryItems.value[currentIndex.value]
);
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
    findNodeByPath(activeNodePath.value, externalRoots.value) ??
    null
  );
});

const canAddFavorite = computed(
  () => !!currentNode.value && !currentNode.value.favoriteId
);

const flattenedFavorites = computed(() => flattenNodes(favoriteRoots.value));
const flattenedExternal = computed(() => flattenNodes(externalRoots.value));
const flattenedSystem = computed(() => flattenNodes(systemRoots.value));
const flattenedCustom = computed(() => flattenNodes(customRoots.value));
const currentDirectoryLabel = computed(() => {
  if (isRatingCollectionView.value) {
    return RATING_COLLECTION_LABEL;
  }
  return currentNode.value?.path ?? "未选择目录";
});

const thumbnailSize = computed(() => VIEW_MODE_SIZES[viewMode.value]);
const galleryStyle = computed(() => ({
  "--thumb-size": `${thumbnailSize.value}px`,
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
let stopWatchingVolumes: (() => void) | null = null;
const thumbnailCache = useThumbnailCache();
let cleanupAppAction: (() => void) | null = null;
let handleOutsideClick: ((event: MouseEvent) => void) | null = null;
let unsubscribeThemeState: (() => void) | null = null;
function stopWatchingCurrentDirectory() {
  if (stopWatchingDirectory) {
    stopWatchingDirectory();
    stopWatchingDirectory = null;
  }
}

const columns = computed(() =>
  Math.max(
    1,
    Math.floor(containerSize.width / Math.max(80, thumbnailSize.value + 14))
  )
);
const rowHeight = computed(() => thumbnailSize.value + 14);
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
  Math.min(totalRows.value, startRow.value + visibleRows.value + bufferRows * 2)
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
  updateResponsiveLayout();
  window.addEventListener("resize", handleWindowResize);
  loadCustomDirectories();
  loadRecentDirectories();
  await bootstrapSidebar();
  setupGalleryObservers();
  window.addEventListener("keydown", handleKeydown);
  const initialTheme = getTheme();
  themePreference.value = initialTheme.preference;
  themeMode.value = initialTheme.mode;
  unsubscribeThemeState = subscribeTheme((state) => {
    themePreference.value = state.preference;
    themeMode.value = state.mode;
  });

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
    if (themeMenuOpen.value) {
      const themeEl = themeMenuRef.value;
      if (themeEl && !themeEl.contains(target)) {
        closeThemeMenu();
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
  window.removeEventListener("resize", handleWindowResize);
  cancelMomentum();
  clearToastTimers();
  stopWatchingCurrentDirectory();
  if (stopWatchingVolumes) {
    stopWatchingVolumes();
    stopWatchingVolumes = null;
  }
  if (bootstrapRetryTimer) {
    window.clearTimeout(bootstrapRetryTimer);
    bootstrapRetryTimer = null;
  }
  if (handleOutsideClick) {
    document.removeEventListener("mousedown", handleOutsideClick);
    handleOutsideClick = null;
  }
  cleanupAppAction?.();
  cleanupAppAction = null;
  unsubscribeThemeState?.();
  unsubscribeThemeState = null;
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
  const electronApi = window.electron;
  if (!electronApi?.fs || !electronApi?.favorites) {
    scheduleBootstrapRetry();
    return;
  }

  try {
    await Promise.all([
      loadSystemDirectories(),
      loadFavorites(),
      loadExternalVolumes(),
    ]);
    setupVolumeWatcher();
    bootstrapRetryCount = 0;
    if (bootstrapRetryTimer) {
      window.clearTimeout(bootstrapRetryTimer);
      bootstrapRetryTimer = null;
    }
  } catch (error) {
    console.error("初始化侧栏失败", error);
    scheduleBootstrapRetry();
  }
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
  type: SidebarNodeType;
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
  if (!fs) {
    throw new Error("文件系统 API 未就绪");
  }
  const dirs = await fs.getSystemDirectories();
  systemRoots.value = dirs.map((dir) =>
    createNode({ path: dir.path, name: dir.name, depth: 0, type: "system" })
  );
}

async function loadExternalVolumes() {
  if (!isMacPlatform) {
    externalRoots.value = [];
    return;
  }
  const fs = window.electron?.fs;
  if (!fs?.getExternalVolumes) {
    externalRoots.value = [];
    return;
  }
  try {
    const volumes = await fs.getExternalVolumes();
    externalRoots.value = (volumes ?? []).map((vol) =>
      createNode({
        path: vol.path,
        name: vol.name,
        depth: 0,
        type: "external",
        register: false,
        reuseExisting: false,
      })
    );
  } catch (error) {
    console.warn("读取外接卷信息失败，外接存储功能不可用", error);
    externalRoots.value = [];
  }
}

async function loadFavorites() {
  const favoritesApi = window.electron?.favorites;
  if (!favoritesApi) {
    throw new Error("收藏 API 未就绪");
  }
  const favorites = await favoritesApi.list();
  applyFavorites(favorites ?? []);
}

function applyFavorites(entries: FavoriteEntry[] = []) {
  allFavoriteEntries.value = entries;
  const favoriteDirectories = entries.filter(
    (fav) => (fav.kind ?? "favorite") === "favorite"
  );

  favoriteRoots.value = favoriteDirectories
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }))
    .map((fav) =>
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

  const nextRatings = new Map<string, number>();
  entries.forEach((fav) => {
    if (fav.rating && fav.rating >= 1 && fav.rating <= 5) {
      nextRatings.set(fav.path, fav.rating);
    }
  });
  ratedImages.value = nextRatings;
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
  localStorage.setItem(
    RECENT_STORAGE_KEY,
    JSON.stringify(recentDirectories.value)
  );
}

function trackRecentDirectory(path: string, name: string) {
  if (!path) return;
  const entries = recentDirectories.value.filter(
    (entry) => entry.path !== path
  );
  entries.unshift({ path, name });
  recentDirectories.value = entries.slice(0, 10);
  saveRecentDirectories();
}

function clearSearch() {
  searchQuery.value = "";
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

function setViewMode(mode: ViewMode) {
  viewMode.value = mode;
}

function getDirectoryFromPath(path: string) {
  const normalized = path.replace(/\\/g, "/");
  const index = normalized.lastIndexOf("/");
  if (index <= 0) return normalized;
  return normalized.slice(0, index);
}

async function addCustomDirectory() {
  const directory = await window.electron?.selectDirectory?.({
    title: "添加自定义目录",
  });
  if (!directory) return;
  const name = extractName(directory);
  const id = crypto.randomUUID?.() ?? `${Date.now()}`;
  customEntries.value = [
    { id, path: directory, name },
    ...customEntries.value.filter((entry) => entry.path !== directory),
  ];
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

  const result = await fs.readDirectory(path);

  imageList.value =
    result?.items
      .filter(
        (item) =>
          item.type === "file" &&
          item.extension &&
          SUPPORTED_IMAGE_EXTENSIONS.has(item.extension.toLowerCase())
      )
      .map((item) => ({
        path: item.path,
        resource: toImageResource(item.path),
        name: item.name,
        extension: item.extension,
        modifiedAt: item.modifiedAt,
        size: item.size,
      })) ?? [];

  // 重置 lightbox 状态
  currentIndex.value = 0;
  lightboxVisible.value = false;
  resetLightboxView();

  // 加载当前目录下包含 psd 的同名分组，用于虚拟“已修”标签
  if (window.electron?.psd) {
    try {
      const groups = await window.electron.psd.getGroups(path);
      psdGroups.value = groups;
      await loadPsdGroups(groups);
    } catch (error) {
      console.warn("加载 PSD 分组失败", error);
    }
  }
}

function openPsdManager() {
  if (!psdGroups.value.length) return;
  psdManagerOpen.value = true;
}

function closePsdManager() {
  psdManagerOpen.value = false;
}

type DirectoryTarget = SidebarNode | { path: string; name: string };

function isSidebarNode(target: DirectoryTarget): target is SidebarNode {
  return typeof (target as SidebarNode).depth === "number";
}

async function activateDirectory(target: DirectoryTarget) {
  const path = target.path;
  const label = target.name;
  if (!path) return;

  // 如果切换到非星级视图，清除星级筛选
  if (path !== RATING_COLLECTION_PATH) {
    selectedRatingFilters.value = new Set();
  }

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
  stopWatchingCurrentDirectory();
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
      currentIndex.value = (currentIndex.value + 1) % galleryItems.value.length;
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

  if (
    !origin ||
    !lightboxCanvasRef.value ||
    scale.value <= 1 ||
    previous === scale.value
  ) {
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
  const currentOffsetX = offset.x;
  const currentOffsetY = offset.y;
  const imageCenterX = centerX + currentOffsetX;
  const imageCenterY = centerY + currentOffsetY;
  const relativeX = origin.x - imageCenterX;
  const relativeY = origin.y - imageCenterY;
  applyOffset(
    currentOffsetX - relativeX * deltaRatio,
    currentOffsetY - relativeY * deltaRatio
  );
}

const prevImage = () => {
  const length = galleryItems.value.length;
  if (!length) return;
  resetLightboxView();
  lightboxDirection.value = "backward";
  currentIndex.value = (currentIndex.value - 1 + length) % length;
};
const nextImage = () => {
  const length = galleryItems.value.length;
  if (!length) return;
  resetLightboxView();
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

type RatingGalleryOptions = {
  resetFilters?: boolean;
  initialRatings?: number[];
};

// 星级相关函数
async function showAllRatedImages(options: RatingGalleryOptions = {}) {
  const { resetFilters = true, initialRatings } = options;
  if (!allFavoriteEntries.value.length) {
    await loadFavorites();
  }

  stopWatchingCurrentDirectory();
  activeNodePath.value = RATING_COLLECTION_PATH;

  if (resetFilters) {
    selectedRatingFilters.value = initialRatings
      ? new Set(initialRatings)
      : new Set();
    searchQuery.value = "";
  } else if (initialRatings?.length) {
    const next = new Set(selectedRatingFilters.value);
    initialRatings.forEach((rating) => next.add(rating));
    selectedRatingFilters.value = next;
  }

  const ratedEntries = allFavoriteEntries.value.filter(
    (entry) => entry.rating && entry.rating >= 1 && entry.rating <= 5
  );

  const fs = window.electron?.fs;
  const directoryCache = new Map<string, DirectorySnapshot | null>();

  const items: GalleryItem[] = await Promise.all(
    ratedEntries.map(async (entry) => {
      let modifiedAt = 0;
      let size = 0;

      if (fs) {
        const dir = getDirectoryFromPath(entry.path);
        let snapshot = directoryCache.get(dir);
        if (snapshot === undefined) {
          try {
            snapshot = (await fs.readDirectory(dir, {
              filter: "all",
            })) as DirectorySnapshot;
          } catch {
            snapshot = null;
          }
          directoryCache.set(dir, snapshot);
        }
        const fileItem = snapshot?.items.find(
          (item) => item.path === entry.path
        );
        if (fileItem) {
          modifiedAt = fileItem.modifiedAt;
          size = fileItem.size;
        }
      }

      return {
        path: entry.path,
        resource: toImageResource(entry.path),
        name: entry.name,
        extension: extractExtension(entry.path),
        modifiedAt,
        size,
      };
    })
  );

  items.sort((a, b) => {
    const ratingA = ratedImages.value.get(a.path) || 0;
    const ratingB = ratedImages.value.get(b.path) || 0;
    if (ratingB !== ratingA) {
      return ratingB - ratingA;
    }
    return a.name.localeCompare(b.name, undefined, { numeric: true });
  });

  imageList.value = items;
  currentIndex.value = 0;
  lightboxVisible.value = false;
  resetLightboxView();
}

function toggleRatingFilter(rating: number) {
  const next = new Set(selectedRatingFilters.value);
  if (next.has(rating)) {
    next.delete(rating);
  } else {
    next.add(rating);
  }
  selectedRatingFilters.value = next;
}

function clearRatingFilters() {
  if (selectedRatingFilters.value.size === 0) return;
  selectedRatingFilters.value = new Set();
}

function isRatingFiltered(rating: number): boolean {
  return selectedRatingFilters.value.has(rating);
}

function getRatingCount(rating: number): number {
  let count = 0;
  ratedImages.value.forEach((value) => {
    if (value === rating) count += 1;
  });
  return count;
}

const hasAnyRatedImages = computed(() => totalRatedCount.value > 0);

function extractExtension(path: string): string {
  const match = path.match(/\.([^.]+)$/);
  return match ? match[1].toLowerCase() : "";
}

async function setImageRating(path: string, rating: number) {
  const favoritesApi = window.electron?.favorites;
  if (!favoritesApi) return;
  try {
    const updated = await favoritesApi.setRating(path, rating);
    if (updated) {
      applyFavorites(updated);
    } else {
      await loadFavorites();
    }
    showToast(rating === 0 ? "已取消评级" : `已设置为 ${rating} 星`, "success");

    // 如果当前在星级视图，刷新显示
    if (isRatingCollectionView.value) {
      await showAllRatedImages({ resetFilters: false });
    }
  } catch (error) {
    console.error("设置评级失败", error);
    showToast("设置评级失败", "error");
  }
}

async function addCurrentToFavorites() {
  const node = currentNode.value;
  const favoritesApi = window.electron?.favorites;
  if (!node || !favoritesApi) return;
  const updated = await favoritesApi.add(node.path, node.name);
  if (updated) {
    applyFavorites(updated);
  } else {
    await loadFavorites();
  }
}

async function removeFavorite(id: string) {
  const favoritesApi = window.electron?.favorites;
  if (!favoritesApi) return;
  const updated = await favoritesApi.remove(id);
  if (updated) {
    applyFavorites(updated);
  } else {
    await loadFavorites();
  }
}

function getImageRating(path: string): number | undefined {
  return ratedImages.value.get(path);
}

function handleRatingClick(
  event: MouseEvent | KeyboardEvent,
  item: GalleryItem
) {
  event.preventDefault();
  event.stopPropagation();

  const currentRating = getImageRating(item.path);
  const target = event.target as HTMLElement;
  const starElement = target.closest(
    ".viewer-gallery__rating-star"
  ) as HTMLElement;

  if (!starElement || !starElement.parentElement) return;

  const stars = Array.from(starElement.parentElement.children);
  const starIndex = stars.indexOf(starElement);
  const newRating = starIndex + 1;

  // 如果点击的是当前评级，则取消评级
  if (currentRating === newRating) {
    setImageRating(item.path, 0);
  } else {
    setImageRating(item.path, newRating);
  }
}

function handleLightboxRatingClick(rating: number) {
  const current = currentGalleryItem.value;
  if (!current) return;

  const currentRating = getImageRating(current.path);

  // 如果点击的是当前评级，则取消评级
  if (currentRating === rating) {
    setImageRating(current.path, 0);
  } else {
    setImageRating(current.path, rating);
  }
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
  if (
    !copyMode &&
    dragPayload.sourcePath &&
    dragPayload.sourcePath === targetPath
  ) {
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
  return !!node.path && !!dragPayload.indexes.length && node.isDirectory;
}

function getDraggedItems(indexes = dragPayload.indexes) {
  return indexes
    .map((idx) => galleryItems.value[idx])
    .filter((item): item is GalleryItem => !!item);
}

function setDropEffect(event: DragEvent) {
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect =
      event.altKey || event.metaKey ? "copy" : "move";
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
    if (lightboxVisible.value) {
      event.preventDefault();
      closeLightbox();
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
  event.preventDefault();
  const zoomFactorBase = event.ctrlKey ? 520 : 720;
  const multiplier = Math.exp(-event.deltaY / zoomFactorBase);
  zoomTo(scale.value * multiplier, { x: event.clientX, y: event.clientY });
}

function handlePointerDown(event: PointerEvent) {
  if (!canPan.value || scale.value <= 1) return;
  event.preventDefault();
  event.stopPropagation();
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
  // 停止拖动后不再启动惯性，避免视图继续“冲”很远
  if (!canPan.value || scale.value <= 1) {
    setOffset(0, 0);
  }
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
  if (themeMenuOpen.value) {
    closeThemeMenu();
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
  if (themeMenuOpen.value) {
    closeThemeMenu();
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

function closeViewerMenu() {
  viewerMenuOpen.value = false;
}

function toggleThemeMenu() {
  if (actionsMenuOpen.value) {
    closeActionsMenu();
  }
  if (sortMenuOpen.value) {
    closeSortMenu();
  }
  if (viewerMenuOpen.value) {
    closeViewerMenu();
  }
  themeMenuOpen.value = !themeMenuOpen.value;
}

function closeThemeMenu() {
  themeMenuOpen.value = false;
}

function selectThemePreference(value: ThemePreference) {
  setTheme(value);
  closeThemeMenu();
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
  if (!activeNodePath.value) return;
  if (isRatingCollectionView.value) {
    await showAllRatedImages({ resetFilters: false });
    return;
  }
  await loadImagesForDirectory(activeNodePath.value);
}

function scheduleBootstrapRetry() {
  if (bootstrapRetryCount >= MAX_BOOTSTRAP_RETRY) return;
  if (bootstrapRetryTimer) {
    window.clearTimeout(bootstrapRetryTimer);
  }
  const delay = BOOTSTRAP_RETRY_DELAY * Math.pow(2, bootstrapRetryCount);
  bootstrapRetryTimer = window.setTimeout(() => {
    bootstrapSidebar();
  }, delay);
  bootstrapRetryCount += 1;
}

function setupVolumeWatcher() {
  if (!isMacPlatform) return;
  const fs = window.electron?.fs;
  if (!fs?.watchDirectory) return;
  if (stopWatchingVolumes) {
    stopWatchingVolumes();
    stopWatchingVolumes = null;
  }
  try {
    stopWatchingVolumes = fs.watchDirectory("/Volumes", () => {
      loadExternalVolumes().catch((error) => {
        console.error("刷新外接存储失败", error);
      });
    });
  } catch (error) {
    console.warn("监听 /Volumes 失败，外接存储热插拔不可用", error);
    stopWatchingVolumes = null;
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
    showToast(
      `已复制 ${selectedGalleryItems.value.length} 张到 ${extractName(
        destination
      )}`,
      "success"
    );
    if (destination === activeNodePath.value) {
      await refreshCurrentDirectory();
    }
  } catch (error) {
    console.error(error);
    showToast("复制失败，请重试", "error");
  }
}

function updateResponsiveLayout() {
  if (typeof window === "undefined") return;
  const width = window.innerWidth;
  const wasNarrow = isNarrowLayout.value;
  const nextIsNarrow = width < SIDEBAR_BREAKPOINT;
  isNarrowLayout.value = nextIsNarrow;

  if (nextIsNarrow && !wasNarrow) {
    // 进入窄屏模式时默认折叠侧边栏，让缩略图区域优先展示
    isSidebarCollapsed.value = true;
  } else if (!nextIsNarrow && wasNarrow) {
    // 退出窄屏模式时自动恢复显示侧边栏
    isSidebarCollapsed.value = false;
  }
}

function handleWindowResize() {
  updateResponsiveLayout();
}

function toggleSidebar() {
  // 在窄屏下允许手动展开/收起侧边栏
  if (!isNarrowLayout.value) return;
  isSidebarCollapsed.value = !isSidebarCollapsed.value;
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
  --viewer-pad: clamp(12px, 2.8vw, 32px);
  height: 100vh;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 0 var(--viewer-pad) 20px;
  color: var(--color-text);
  background: var(--color-window);
  box-sizing: border-box;
  overflow: hidden;
  font-family: "SF Pro Text", "SF Pro Display", -apple-system,
    BlinkMacSystemFont, "Segoe UI", sans-serif;
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

.toolbar-content {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 18px;
}

.toolbar-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: nowrap;
  white-space: nowrap;
  -webkit-app-region: no-drag;
}

.toolbar-actions > * {
  flex-shrink: 0;
}

.toolbar-icon-group {
  display: flex;
  gap: 8px;
}

.toolbar-viewer-inline {
  gap: 6px;
}

.toolbar-selection-count {
  display: none;
}

.toolbar-left {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8px;
}

.toolbar-spacer {
  flex: 1;
}

.toolbar-title {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-family: "SF Pro Text", -apple-system, BlinkMacSystemFont, "Segoe UI",
    sans-serif;
  color: rgba(28, 28, 30, 0.75);
}

.toolbar-title__primary {
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.toolbar-title__path {
  font-size: 12px;
  color: rgba(60, 60, 67, 0.8);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 280px;
}

.toolbar-groups {
  display: flex;
  align-items: center;
  gap: 12px;
}

.toolbar-sidebar-toggle {
  display: none;
  width: 28px;
  height: 28px;
  border-radius: 8px;
  border: 1px solid transparent;
  background: transparent;
  color: rgba(60, 60, 67, 0.75);
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.2s ease, border-color 0.2s ease, color 0.2s ease,
    transform 0.2s ease;
}

.toolbar-sidebar-toggle svg {
  width: 16px;
  height: 16px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  transform: rotate(-90deg);
}

.toolbar-sidebar-toggle.is-collapsed svg {
  transform: rotate(90deg);
}

.toolbar-sidebar-toggle:hover {
  background: rgba(10, 132, 255, 0.14);
  border-color: rgba(10, 132, 255, 0.4);
  color: #0a84ff;
}

.viewer--narrow .toolbar-sidebar-toggle {
  display: inline-flex;
}

.toolbar-group {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 2px 4px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.38);
  border: 1px solid rgba(120, 130, 150, 0.16);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.75);
  -webkit-app-region: no-drag;
}

.toolbar-group--pill {
  gap: 8px;
}

.toolbar-group--pill .toolbar-dropdown {
  background: transparent;
  border: none;
  box-shadow: none;
  padding: 0;
}

.toolbar-button {
  width: 32px;
  height: 32px;
  border-radius: 9px;
  border: 1px solid rgba(90, 100, 120, 0.18);
  background: rgba(255, 255, 255, 0.6);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: rgba(28, 28, 30, 0.85);
  cursor: pointer;
  transition: background 0.2s ease, border-color 0.2s ease, color 0.2s ease;
}

.toolbar-button svg,
.toolbar-dropdown__trigger svg,
.toolbar-dropdown__icon svg {
  width: 18px;
  height: 18px;
  vector-effect: non-scaling-stroke;
}

.toolbar-button svg path,
.toolbar-dropdown__trigger svg path,
.toolbar-dropdown__icon svg path {
  fill: none;
  stroke: currentColor;
  stroke-width: 1.4;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.toolbar-button:hover:not(:disabled) {
  background: rgba(10, 132, 255, 0.14);
  border-color: rgba(10, 132, 255, 0.4);
  color: #0a84ff;
}

.toolbar-button.is-active {
  background: rgba(92, 107, 192, 0.18);
  border-color: rgba(92, 107, 192, 0.5);
  color: #1e3a8a;
}

.toolbar-button:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.toolbar-view-mode {
  gap: 6px;
}

.toolbar-search {
  position: relative;
  width: 240px;
  height: 32px;
  display: flex;
  align-items: center;
  padding: 0 12px;
  border-radius: 12px;
  border: 1px solid rgba(90, 100, 120, 0.16);
  background: rgba(255, 255, 255, 0.68);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.85);
}

.toolbar-search__icon {
  width: 16px;
  height: 16px;
  color: rgba(60, 60, 67, 0.6);
  margin-right: 6px;
}

.toolbar-search__icon path {
  fill: none;
  stroke: currentColor;
  stroke-width: 1.4;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.toolbar-search__input {
  flex: 1;
  border: none;
  background: transparent;
  font-size: 13px;
  color: rgba(28, 28, 30, 0.9);
  outline: none;
}

.toolbar-search__clear {
  border: none;
  background: transparent;
  font-size: 16px;
  color: rgba(60, 60, 67, 0.5);
  cursor: pointer;
  padding: 0 4px;
}

.toolbar-rating-filter {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 12px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.68);
  border: 1px solid rgba(90, 100, 120, 0.16);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.85);
}

.toolbar-rating-filter__label {
  font-size: 12px;
  color: rgba(60, 60, 67, 0.7);
  white-space: nowrap;
}

.toolbar-rating-filter__stars {
  display: flex;
  gap: 4px;
  align-items: center;
}

.toolbar-rating-filter__star {
  position: relative;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  border: 1px solid rgba(90, 100, 120, 0.18);
  background: rgba(255, 255, 255, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  color: rgba(180, 190, 210, 0.7);
}

.toolbar-rating-filter__star:hover {
  background: rgba(10, 132, 255, 0.14);
  border-color: rgba(10, 132, 255, 0.4);
  color: #0a84ff;
}

.toolbar-rating-filter__star.is-active {
  background: rgba(246, 173, 85, 0.2);
  border-color: rgba(246, 173, 85, 0.5);
  color: #f6ad55;
}

.toolbar-rating-filter__star svg {
  width: 16px;
  height: 16px;
  fill: currentColor;
}

.toolbar-rating-filter__count {
  position: absolute;
  bottom: -2px;
  right: -2px;
  font-size: 9px;
  font-weight: 600;
  color: rgba(60, 60, 67, 0.8);
  background: rgba(255, 255, 255, 0.9);
  border-radius: 8px;
  padding: 1px 3px;
  line-height: 1;
  min-width: 12px;
  text-align: center;
}

.toolbar-rating-filter__star.is-active .toolbar-rating-filter__count {
  background: rgba(246, 173, 85, 0.3);
  color: #f6ad55;
}

.toolbar-rating-filter__clear {
  font-size: 12px;
  color: rgba(60, 60, 67, 0.6);
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.toolbar-rating-filter__clear:hover {
  background: rgba(10, 132, 255, 0.1);
  color: #0a84ff;
}

.viewer-sidebar {
  width: 260px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  padding: 18px 12px;
  border-radius: 18px;
  border: 1px solid rgba(120, 130, 150, 0.08);
  background: linear-gradient(
    180deg,
    rgba(248, 249, 252, 0.72),
    rgba(244, 246, 250, 0.82)
  );
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.7),
    0 25px 60px rgba(15, 23, 42, 0.08);
  backdrop-filter: blur(28px) saturate(160%);
}

.sidebar-utility {
  display: none;
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
  overflow-y: hidden;
  padding-right: 4px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.sidebar-groups--flush {
  padding-right: 0;
  gap: 14px;
}

.sidebar-group {
  display: flex;
  flex-direction: column;
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
  max-height: 220px;
  overflow-y: auto;
  padding-right: 4px;
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

.sidebar-item--favorite-image {
  background: rgba(255, 255, 255, 0.6);
  border-radius: 10px;
  border: 1px solid rgba(90, 100, 120, 0.14);
  padding: 4px 12px;
}

.sidebar-item__action {
  border: none;
  background: transparent;
  color: rgba(60, 60, 67, 0.5);
  width: 26px;
  height: 26px;
  border-radius: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease;
}

.sidebar-item__action svg {
  width: 18px;
  height: 18px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.6;
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

.viewer-body {
  flex: 1;
  display: flex;
  gap: 12px;
  min-height: 0;
  padding-top: 12px;
  transition: padding 0.2s ease;
}

.viewer-body--narrow {
  gap: 8px;
}

.viewer-sidebar {
  width: 260px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  padding: 18px 12px;
  border-radius: 18px;
  border: 1px solid rgba(120, 130, 150, 0.08);
  background: linear-gradient(
    180deg,
    rgba(248, 249, 252, 0.72),
    rgba(244, 246, 250, 0.82)
  );
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.7),
    0 25px 60px rgba(15, 23, 42, 0.08);
  backdrop-filter: blur(28px) saturate(160%);
  overflow: hidden;
  transition: width 0.25s ease, padding 0.25s ease, margin 0.25s ease,
    opacity 0.2s ease, transform 0.25s ease, border-color 0.25s ease,
    box-shadow 0.25s ease;
}

.viewer-sidebar--collapsed {
  width: 0;
  padding-left: 0;
  padding-right: 0;
  margin-left: -4px;
  margin-right: -4px;
  border-color: transparent;
  box-shadow: none;
  opacity: 0;
  transform: translateX(-12px);
  pointer-events: none;
}

.viewer-body--sidebar-collapsed .viewer-main {
  flex: 1;
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
  display: none;
}

.toolbar-pill {
  min-width: 105px;
  text-align: center;
  padding: 5px 14px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.82);
  border: 1px solid rgba(90, 100, 120, 0.16);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.85);
  font-size: 13px;
  font-weight: 600;
  color: rgba(28, 28, 30, 0.9);
}

.toolbar-dropdown {
  position: relative;
}

.toolbar-dropdown.is-open .toolbar-dropdown__trigger {
  background: rgba(92, 107, 192, 0.16);
  border-color: rgba(92, 107, 192, 0.4);
}

.toolbar-dropdown__trigger {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: 1px solid rgba(90, 100, 120, 0.2);
  border-radius: 9px;
  padding: 6px 12px;
  background: rgba(255, 255, 255, 0.65);
  color: rgba(28, 28, 30, 0.85);
  cursor: pointer;
  font-size: 13px;
  letter-spacing: 0.04em;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.6);
}

.toolbar-dropdown__trigger:not(:disabled):hover {
  background: rgba(10, 132, 255, 0.14);
  border-color: rgba(10, 132, 255, 0.4);
  color: #0a84ff;
}

.toolbar-dropdown__trigger--icon {
  width: 32px;
  height: 32px;
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

.toolbar-dropdown__meta {
  display: block;
  font-size: 11px;
  color: rgba(60, 60, 67, 0.55);
}

.toolbar-dropdown__empty {
  margin: 4px 0 0;
  padding: 6px;
  font-size: 12px;
  color: rgba(60, 60, 67, 0.5);
}

.toolbar-dropdown__icon {
  width: 20px;
  height: 20px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
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
  padding: 8px;
  border-radius: 18px;
  background: var(--color-surface);
  border: 1px solid var(--color-divider);
  box-shadow: var(--color-shadow);
  display: block;
}

.viewer-gallery__grid {
  display: grid;
  grid-template-columns: repeat(
    auto-fill,
    minmax(var(--thumb-size, 120px), var(--thumb-size, 120px))
  );
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
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease,
    background 0.2s ease;
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
  background: linear-gradient(
    120deg,
    rgba(255, 255, 255, 0.12),
    rgba(92, 107, 192, 0.12),
    rgba(255, 255, 255, 0.12)
  );
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

.psd-tag {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-right: 6px;
  padding: 0 6px;
  border-radius: 8px;
  border: 1px solid rgba(90, 100, 120, 0.25);
  background: rgba(255, 255, 255, 0.9);
  font-size: 11px;
  color: rgba(60, 60, 67, 0.7);
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease,
    color 0.15s ease;
}

.psd-tag--active {
  border-color: rgba(10, 132, 255, 0.7);
  background: rgba(10, 132, 255, 0.12);
  color: #0a84ff;
}

.psd-manager {
  position: fixed;
  right: 24px;
  bottom: 24px;
  width: 340px;
  max-height: 60vh;
  border-radius: 16px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  background: rgba(255, 255, 255, 0.97);
  box-shadow: 0 20px 40px rgba(15, 23, 42, 0.22);
  padding: 12px 12px 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  z-index: 60;
}

.psd-manager__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.psd-manager__title {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: rgba(28, 28, 30, 0.9);
}

.psd-manager__close {
  border: none;
  background: transparent;
  font-size: 18px;
  line-height: 1;
  width: 24px;
  height: 24px;
  border-radius: 999px;
  cursor: pointer;
  color: rgba(60, 60, 67, 0.6);
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.psd-manager__close:hover {
  background: rgba(0, 0, 0, 0.05);
}

.psd-manager__body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding-top: 4px;
}

.psd-manager__empty {
  margin: 6px 2px 4px;
  font-size: 12px;
  color: rgba(60, 60, 67, 0.6);
}

.psd-manager__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.psd-manager__item {
  padding: 8px 8px;
  border-radius: 10px;
  border: 1px solid rgba(120, 130, 150, 0.14);
  background: rgba(248, 249, 252, 0.95);
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.psd-manager__main {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 6px;
}

.psd-manager__name {
  flex: 1;
  font-size: 12px;
  color: rgba(28, 28, 30, 0.9);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.psd-manager__badge {
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 999px;
  background: rgba(255, 186, 73, 0.18);
  color: #c97a10;
}

.psd-manager__meta {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: rgba(60, 60, 67, 0.7);
}

.psd-manager__label {
  color: rgba(60, 60, 67, 0.7);
}

.psd-manager__label-muted {
  color: rgba(60, 60, 67, 0.45);
}

.psd-manager__variant {
  padding: 1px 5px;
  border-radius: 999px;
  border: 1px solid rgba(120, 130, 150, 0.3);
  background: rgba(255, 255, 255, 0.9);
}

.psd-manager__action {
  margin-top: 4px;
  align-self: flex-end;
  font-size: 12px;
  padding: 4px 10px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  background: rgba(10, 132, 255, 0.1);
  color: #0a84ff;
  transition: background 0.15s ease, color 0.15s ease;
}

.psd-manager__action:hover {
  background: rgba(10, 132, 255, 0.18);
}

.viewer-gallery__item.is-active {
  border-color: rgba(10, 132, 255, 0.75);
  background: rgba(10, 132, 255, 0.16);
  box-shadow: 0 4px 18px rgba(10, 132, 255, 0.4);
}

.viewer-gallery__actions {
  position: absolute;
  top: 8px;
  right: 8px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  align-items: flex-end;
}

.viewer-gallery__rating {
  display: flex;
  gap: 2px;
  padding: 4px 6px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(8px);
  cursor: pointer;
  transition: background 0.2s ease;
}

.viewer-gallery__rating:hover {
  background: rgba(255, 255, 255, 0.95);
}

.viewer-gallery__rating-star {
  width: 14px;
  height: 14px;
  color: rgba(180, 190, 210, 0.6);
  transition: color 0.2s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.viewer-gallery__rating-star.is-filled {
  color: #f6ad55;
}

.viewer-gallery__rating-star svg {
  width: 100%;
  height: 100%;
  fill: currentColor;
}

.viewer-gallery__fav {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: none;
  background: rgba(255, 255, 255, 0.85);
  color: rgba(180, 190, 210, 0.9);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease;
}

.viewer-gallery__fav svg {
  width: 14px;
  height: 14px;
  fill: currentColor;
}

.viewer-gallery__fav.is-active {
  background: rgba(255, 255, 255, 0.95);
  color: #f6ad55;
}

.viewer-gallery__fav:hover {
  background: rgba(10, 132, 255, 0.15);
  color: #0a84ff;
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
  background: radial-gradient(
      circle at 20% 20%,
      rgba(66, 165, 245, 0.25),
      transparent 45%
    ),
    radial-gradient(circle at 80% 0%, rgba(124, 87, 255, 0.25), transparent 50%),
    rgba(3, 6, 14, 0.85);
}

.viewer-lightbox__content {
  position: relative;
  width: min(1100px, 92vw);
  height: min(820px, 88vh);
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 20px 24px 24px;
  border-radius: 28px;
  background: rgba(8, 12, 28, 0.92);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 35px 70px rgba(5, 7, 15, 0.65);
  z-index: 1;
  backdrop-filter: blur(40px) saturate(140%);
}

.viewer-lightbox__chrome {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  padding-bottom: 4px;
}

.viewer-lightbox__info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  color: #e2e8f0;
}

.viewer-lightbox__status {
  font-size: 12px;
  letter-spacing: 0.14em;
  color: rgba(226, 232, 240, 0.65);
  text-transform: uppercase;
  margin: 0;
}

.viewer-lightbox__title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #fdfdfd;
}

.viewer-lightbox__subtext {
  margin: 0;
  font-size: 13px;
  color: rgba(226, 232, 240, 0.7);
}

.viewer-lightbox__header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.viewer-lightbox__controls {
  display: flex;
  gap: 6px;
}

.viewer-lightbox__toolbar-btn {
  width: 36px;
  height: 36px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(12, 18, 34, 0.65);
  color: #f8fafc;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.2s ease, border-color 0.2s ease;
}

.viewer-lightbox__toolbar-btn svg {
  width: 18px;
  height: 18px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.6;
}

.viewer-lightbox__toolbar-btn:hover {
  background: rgba(66, 165, 245, 0.25);
  border-color: rgba(66, 165, 245, 0.6);
}

.viewer-lightbox__toolbar-btn.is-active {
  background: rgba(66, 165, 245, 0.3);
  border-color: rgba(66, 165, 245, 0.8);
}

.viewer-lightbox__toolbar-btn--close {
  background: rgba(255, 255, 255, 0.08);
  color: #fefefe;
}

.viewer-lightbox__rating {
  display: flex;
  gap: 4px;
  align-items: center;
  padding: 0 12px;
  margin-left: 12px;
  border-left: 1px solid rgba(255, 255, 255, 0.1);
}

.viewer-lightbox__rating-star {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: rgba(255, 255, 255, 0.4);
  transition: color 0.2s ease, transform 0.1s ease;
  border-radius: 6px;
}

.viewer-lightbox__rating-star:hover {
  color: rgba(246, 173, 85, 0.8);
  background: rgba(246, 173, 85, 0.1);
  transform: scale(1.1);
}

.viewer-lightbox__rating-star.is-filled {
  color: #f6ad55;
}

.viewer-lightbox__rating-star svg {
  width: 20px;
  height: 20px;
  fill: currentColor;
}

.viewer-lightbox__canvas {
  flex: 1;
  min-height: 480px;
  max-height: calc(100% - 90px);
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 18px;
  background: rgba(5, 7, 20, 0.78);
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.08);
  touch-action: none;
}

.viewer-lightbox__canvas--pannable {
  cursor: grab;
}

.viewer-lightbox__canvas--pannable.is-grabbing {
  cursor: grabbing;
}

.viewer-lightbox__canvas :deep(.image-wrapper) {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  box-shadow: none;
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
  background: rgba(12, 18, 30, 0.32);
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
  background: rgba(66, 165, 245, 0.4);
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
  .viewer-body {
    gap: 8px;
  }
}

:root[data-theme="dark"] .viewer {
  background: radial-gradient(
      circle at top,
      rgba(68, 78, 120, 0.2),
      transparent 60%
    ),
    var(--color-window);
}

:root[data-theme="dark"] .viewer-unified-toolbar {
  background: rgba(21, 23, 34, 0.88);
  border-color: rgba(255, 255, 255, 0.08);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04),
    0 12px 30px rgba(3, 3, 5, 0.65);
}

:root[data-theme="dark"] .toolbar-title,
:root[data-theme="dark"] .toolbar-dropdown__item,
:root[data-theme="dark"] .toolbar-dropdown__label {
  color: var(--color-text);
}

:root[data-theme="dark"] .toolbar-title__path,
:root[data-theme="dark"] .toolbar-dropdown__meta,
:root[data-theme="dark"] .toolbar-search__input {
  color: rgba(226, 232, 240, 0.7);
}

:root[data-theme="dark"] .toolbar-button,
:root[data-theme="dark"] .toolbar-dropdown__trigger,
:root[data-theme="dark"] .toolbar-search {
  background: rgba(34, 37, 54, 0.85);
  border-color: rgba(255, 255, 255, 0.12);
  color: var(--color-text);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05);
}

:root[data-theme="dark"] .toolbar-button:hover:not(:disabled),
:root[data-theme="dark"] .toolbar-dropdown__trigger:not(:disabled):hover {
  background: rgba(91, 104, 168, 0.35);
  border-color: rgba(145, 167, 255, 0.6);
  color: #a5b4ff;
}

:root[data-theme="dark"] .toolbar-search__input {
  color: var(--color-text);
}

:root[data-theme="dark"] .toolbar-rating-filter {
  background: rgba(34, 37, 54, 0.85);
  border-color: rgba(255, 255, 255, 0.12);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05);
}

:root[data-theme="dark"] .toolbar-rating-filter__label {
  color: rgba(226, 232, 240, 0.7);
}

:root[data-theme="dark"] .toolbar-rating-filter__star {
  background: rgba(34, 37, 54, 0.6);
  border-color: rgba(255, 255, 255, 0.12);
  color: rgba(255, 255, 255, 0.4);
}

:root[data-theme="dark"] .toolbar-rating-filter__star:hover {
  background: rgba(10, 132, 255, 0.2);
  border-color: rgba(10, 132, 255, 0.4);
  color: #0a84ff;
}

:root[data-theme="dark"] .toolbar-rating-filter__star.is-active {
  background: rgba(246, 173, 85, 0.25);
  border-color: rgba(246, 173, 85, 0.5);
  color: #f9e2af;
}

:root[data-theme="dark"] .toolbar-rating-filter__count {
  background: rgba(34, 37, 54, 0.9);
  color: rgba(255, 255, 255, 0.7);
}

:root[data-theme="dark"]
  .toolbar-rating-filter__star.is-active
  .toolbar-rating-filter__count {
  background: rgba(246, 173, 85, 0.3);
  color: #f9e2af;
}

:root[data-theme="dark"] .toolbar-rating-filter__clear {
  color: rgba(226, 232, 240, 0.6);
}

:root[data-theme="dark"] .toolbar-rating-filter__clear:hover {
  background: rgba(10, 132, 255, 0.15);
  color: #0a84ff;
}

:root[data-theme="dark"] .toolbar-dropdown__menu {
  background: rgba(18, 20, 32, 0.96);
  border-color: rgba(255, 255, 255, 0.1);
  box-shadow: 0 20px 40px rgba(3, 5, 15, 0.65),
    inset 0 1px 0 rgba(255, 255, 255, 0.04);
}

:root[data-theme="dark"] .toolbar-dropdown__item:not(:disabled):hover {
  background: rgba(93, 130, 255, 0.18);
}

:root[data-theme="dark"] .viewer-sidebar {
  background: linear-gradient(
    180deg,
    rgba(18, 20, 32, 0.95),
    rgba(12, 14, 24, 0.95)
  );
  border-color: rgba(255, 255, 255, 0.08);
  box-shadow: 0 20px 40px rgba(2, 3, 10, 0.7);
}

:root[data-theme="dark"] .sidebar-item--favorite-image {
  background: rgba(30, 34, 50, 0.85);
  border-color: rgba(255, 255, 255, 0.08);
  color: var(--color-text);
}

:root[data-theme="dark"] .sidebar-group__label {
  color: rgba(209, 213, 224, 0.7);
}

:root[data-theme="dark"] .sidebar-item {
  color: var(--color-text);
}

:root[data-theme="dark"] .sidebar-item__icon {
  color: var(--color-text);
}

:root[data-theme="dark"] .sidebar-item:hover {
  background: rgba(255, 255, 255, 0.05);
}

:root[data-theme="dark"] .sidebar-item.is-active {
  background: rgba(95, 116, 255, 0.2);
  color: var(--color-primary);
}

:root[data-theme="dark"] .viewer-gallery {
  background: var(--color-surface);
  border-color: rgba(255, 255, 255, 0.08);
  box-shadow: 0 20px 40px rgba(4, 6, 14, 0.65);
}

:root[data-theme="dark"] .viewer-gallery__item {
  background: rgba(22, 24, 34, 0.95);
  border-color: rgba(255, 255, 255, 0.08);
  color: var(--color-text);
}

:root[data-theme="dark"] .viewer-gallery__item.is-selected {
  background: linear-gradient(
    180deg,
    rgba(93, 130, 255, 0.3),
    rgba(77, 94, 196, 0.25)
  );
  border-color: rgba(145, 167, 255, 0.6);
}

:root[data-theme="dark"] .viewer-gallery__rating {
  background: rgba(20, 23, 32, 0.9);
}

:root[data-theme="dark"] .viewer-gallery__rating:hover {
  background: rgba(30, 33, 42, 0.95);
}

:root[data-theme="dark"] .viewer-gallery__rating-star {
  color: rgba(255, 255, 255, 0.4);
}

:root[data-theme="dark"] .viewer-gallery__rating-star.is-filled {
  color: #f9e2af;
}

:root[data-theme="dark"] .viewer-gallery__fav {
  background: rgba(20, 23, 32, 0.9);
  color: rgba(255, 255, 255, 0.6);
}

:root[data-theme="dark"] .viewer-gallery__fav.is-active {
  background: rgba(255, 255, 255, 0.2);
  color: #f9e2af;
}

:root[data-theme="dark"] .toolbar-dropdown__menu .toolbar-dropdown__meta {
  color: rgba(226, 232, 240, 0.6);
}

:root[data-theme="dark"] .viewer-lightbox__content {
  background: rgba(12, 16, 32, 0.92);
  border-color: rgba(255, 255, 255, 0.08);
  box-shadow: 0 35px 70px rgba(2, 3, 10, 0.8);
}

:root[data-theme="dark"] .viewer-lightbox__canvas {
  background: rgba(8, 10, 24, 0.85);
  border-color: rgba(255, 255, 255, 0.1);
}

:root[data-theme="dark"] .viewer-lightbox__nav {
  background: rgba(15, 18, 32, 0.55);
}

:root[data-theme="dark"] .viewer-lightbox__nav:hover:not(:disabled) {
  background: rgba(145, 167, 255, 0.45);
}

:root[data-theme="dark"] .viewer-lightbox__backdrop {
  background: radial-gradient(
      circle at 20% 20%,
      rgba(80, 110, 255, 0.35),
      transparent 50%
    ),
    radial-gradient(circle at 80% 0%, rgba(118, 52, 255, 0.3), transparent 60%),
    rgba(2, 5, 15, 0.85);
}
</style>
