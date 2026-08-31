<script setup>
defineProps({
  show: {
    type: Boolean,
    default: false
  },
  titulo: {
    type: String,
    default: ''
  }
});

const emit = defineEmits(['close']);
</script>

<template>
  <div v-if="show" class="modal" @click.self="emit('close')">
    <div class="modal-content">
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
