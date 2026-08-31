<script setup>
import { ref, onMounted, computed } from 'vue';
import { ClaseService } from '@/services/services';
import HeaderSeccion from '@/components/HeaderSeccion.vue';

const clases = ref([]);
const isLoading = ref(true);
const errorMsg = ref('');

// Filtros
const searchQuery = ref('');
const selectedProgram = ref('');

// Lista de programas para el selector de filtros
const programasUnicos = computed(() => {
  const temas = clases.value
    .map(c => c.programas?.programa_tema)
    .filter(Boolean);
  return [...new Set(temas)].sort();
});

// Clases filtradas y ordenadas por clase_num
const filteredClases = computed(() => {
  let list = [...clases.value];

  // Ordenar por número de clase
  list.sort((a, b) => (Number(a.clase_num) || 0) - (Number(b.clase_num) || 0));

  // Filtrar por programa seleccionado
  if (selectedProgram.value) {
    list = list.filter(c => c.programas?.programa_tema === selectedProgram.value);
  }

  // Filtrar por búsqueda de texto
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase().trim();
    list = list.filter(c => {
      const numStr = String(c.clase_num || '');
      const tema = (c.clase_tema || '').toLowerCase();
      const objetivo = (c.clase_objetivo || '').toLowerCase();
      const texto = (c.clase_texto || '').toLowerCase();
      const programa = (c.programas?.programa_tema || '').toLowerCase();

      return numStr.includes(q) ||
             `#${numStr}`.includes(q) ||
             `# ${numStr}`.includes(q) ||
             tema.includes(q) ||
             objetivo.includes(q) ||
             texto.includes(q) ||
             programa.includes(q);
    });
  }

  return list;
});

const loadClases = async () => {
  isLoading.value = true;
  errorMsg.value = '';
  try {
    const { data, error } = await ClaseService.getClasesWithProgramas();
    if (error) throw error;
    clases.value = data || [];
  } catch (error) {
    errorMsg.value = error.message;
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  loadClases();
});
</script>

<template>
  <div>
    <!-- Header de Sección -->
    <HeaderSeccion 
      tipo="clases" 
      titulo="Clases" 
      subtitulo="Listado General de Clases." 
    />

    <!-- Barra de Filtros -->
    <div class="filters-bar filters-bar-small" style="display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 8px; align-items: center;">
      <div style="flex: 1 1 240px; min-width: 140px;">
        <input 
          type="text" 
          v-model="searchQuery"
          class="form-control" 
          placeholder="Buscar Número, Tema, Objetivo, Texto..." 
        >
      </div>
      <div style="width: 220px;">
        <select v-model="selectedProgram" class="form-select">
          <option value="">Programas</option>
          <option v-for="prog in programasUnicos" :key="prog" :value="prog">
            {{ prog }}
          </option>
        </select>
      </div>
    </div>

    <!-- Tabla de Datos -->
    <div class="table-responsive table-clases-scroll">
      <table class="data-table" id="tabla-clases">
        <thead>
          <tr>
            <th>Num</th>
            <th>Tema</th>
            <th>Objetivo</th>
            <th>Texto</th>
            <th>Programa</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="isLoading">
            <td colspan="5" class="loading">Consultando Clases...</td>
          </tr>
          <tr v-else-if="errorMsg">
            <td colspan="5" class="error-msg">❌ Error: {{ errorMsg }}</td>
          </tr>
          <tr v-else-if="filteredClases.length === 0">
            <td colspan="5" style="text-align: center; padding: 20px;">
              No se encontraron clases con los filtros aplicados.
            </td>
          </tr>
          <tr 
            v-else 
            v-for="c in filteredClases" 
            :key="c.id"
          >
            <td data-label="Num"><strong># {{ c.clase_num }}</strong></td>
            <td data-label="Tema" class="text-bold">{{ c.clase_tema }}</td>
            <td data-label="Objetivo"><span class="text-light">{{ c.clase_objetivo }}</span></td>
            <td data-label="Texto"><span class="text-light">{{ c.clase_texto || '' }}</span></td>
            <td data-label="Programa"><span class="text-light">{{ c.programas?.programa_tema || 'Sin programa' }}</span></td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
/* Utiliza los estilos heredados de app.css */
</style>
