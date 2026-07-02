<template>
  <div class="skeleton-wrapper">
    <div 
      v-for="n in count" 
      :key="n" 
      class="skeleton-item"
      :style="{ height: height, borderRadius: borderRadius }"
    >
      <div class="skeleton"></div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  count: {
    type: Number,
    default: 3
  },
  height: {
    type: String,
    default: '80px'
  },
  borderRadius: {
    type: String,
    default: 'var(--radius-lg)'
  }
});
</script>

<style scoped>
.skeleton-wrapper {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
}
.skeleton-item {
  width: 100%;
  overflow: hidden;
  position: relative;
}
/* .skeleton class is globally defined in style.css */
.skeleton-item .skeleton {
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
}
</style>
