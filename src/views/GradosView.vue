<script setup>
import { ref, onMounted } from 'vue';
import { GradoService } from '@/services/services';
import HeaderSeccion from '@/components/HeaderSeccion.vue';

const grados = ref([]);
const isLoading = ref(true);
const errorMsg = ref('');

onMounted(async () => {
  try {
    const { data, error } = await GradoService.getGrados();
    if (error) throw error;
    grados.value = data || [];
  } catch (error) {
    errorMsg.value = error.message;
  } finally {
    isLoading.value = false;
  }
});
</script>

<template>
  <div>
    <!-- Header de Sección -->
    <HeaderSeccion 
      tipo="grados" 
      titulo="Grados" 
      subtitulo="Niveles educativos habilitados." 
    />

    <!-- Tabla de Datos -->
    <div class="table-responsive table-grados-scroll">
      <table class="data-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Nivel</th>
            <th>Nombre</th>
            <th>Descripción</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="isLoading">
            <td colspan="4" class="loading">Consultando niveles...</td>
          </tr>
          <tr v-else-if="errorMsg">
            <td colspan="4" class="error-msg">❌ Error: {{ errorMsg }}</td>
          </tr>
          <tr v-else-if="grados.length === 0">
            <td colspan="4" style="text-align: center; padding: 20px;">No hay grados registrados.</td>
          </tr>
          <tr v-else v-for="g in grados" :key="g.id">
            <td data-label="ID"><strong># {{ g.id }}</strong></td>
            <td data-label="Nivel" class="text-bold">{{ g.grado_numero }}</td>
            <td data-label="Nombre" class="text-light">{{ g.grado_nombre }}</td>
            <td data-label="Descripción"><span class="text-light">{{ g.grado_descripcion }}</span></td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
/* Estilos específicos si se requieren. De lo contrario hereda de app.css */
</style>
