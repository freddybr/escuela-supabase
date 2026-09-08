<script setup>
defineProps({
  show: {
    type: Boolean,
    default: false
  },
  titulo: {
    type: String,
    default: ''
  },
  maxWidth: {
    type: String,
    default: ''
  },
  zIndex: {
    type: [Number, String],
    default: null
  }
});

const emit = defineEmits(['close']);
</script>

<template>
  <div 
    v-if="show" 
    class="modal" 
    :style="zIndex ? { zIndex } : {}"
    @click.self="emit('close')"
  >
    <div 
      class="modal-content"
      :style="maxWidth ? { maxWidth: maxWidth, width: '100%' } : {}"
    >
      <div class="modal-header">
        <h3>{{ titulo }}</h3>
        <button class="modal-close" @click="emit('close')">✕</button>
      </div>
      <div class="modal-body">
        <slot />
      </div>
      <div class="modal-footer">
        <slot name="footer" />
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Utiliza las clases globales definidas en app.css para el modal */
</style>
