<template>
  <div id="app">
    <!-- Barra de carga mientras se obtienen los datos -->
    <div v-if="loading" class="loading-container">
      <div class="loading-bar"></div>
    </div>

    <!-- Estado de salud general del sistema -->
    <div v-if="!loading" class="health-status">
      <p class="health-status-text">
        Estado del Sistema:
        <span :class="systemHealthClass">
          <i class="pi" :class="systemHealthIcon"></i>
          {{ systemHealth }}
        </span>
      </p>
    </div>

    <!-- Información del sistema -->
    <div v-if="!loading && health">
      <!-- Contenedor izquierdo para las barras de progreso -->
      <div class="progress-bars-column">
        <!-- Uso de Memoria -->
        <div class="info-item">
          <i class="pi pi-memory icon"></i>
          <strong>Uso de Memoria RAM:</strong>
          <div class="progress-bar-container">
            <div class="progress-bar-flowing"></div>
            <div class="progress-bar" :style="{ width: health.memory.usage }"></div>
          </div>
          <span>{{ health.memory.used }} / {{ health.memory.total }} ({{ health.memory.usage }})</span>
          <p>Estado: <span :class="getHealthClass(health.memory.usage)">{{ getHealthStatus(health.memory.usage) }}</span></p>
        </div>

        <!-- Uso de CPU -->
        <div class="info-item">
          <i class="pi pi-cpu icon"></i>
          <strong>Uso de CPU:</strong>
          <div class="progress-bar-container">
            <div class="progress-bar-flowing"></div>
            <div class="progress-bar" :style="{ width: health.cpu.load }"></div>
          </div>
          <span>{{ health.cpu.brand }} (Cores: {{ health.cpu.cores }}), Uso: {{ health.cpu.load }}</span>
          <p>Estado: <span :class="getHealthClass(health.cpu.load)">{{ getHealthStatus(health.cpu.load) }}</span></p>
        </div>

        <!-- Uso del Disco -->
        <div class="info-item" v-for="(disk, index) in health.disks" :key="index">
          <i class="pi pi-hdd icon"></i>
          <strong>Disco {{ disk.filesystem }}:</strong>
          <div class="progress-bar-container">
            <div class="progress-bar-flowing"></div>
            <div class="progress-bar" :style="{ width: disk.usage }"></div>
          </div>
          <span>{{ disk.used }} / {{ disk.size }} ({{ disk.usage }})</span>
          <p>Estado: <span :class="getHealthClass(disk.usage)">{{ getHealthStatus(disk.usage) }}</span></p>
        </div>
      </div>

      <!-- Contenedor derecho para la información del sistema -->
      <div class="info-column">
        <div class="info-item">
          <i class="pi pi-clock icon"></i>
          <strong>Tiempo de Actividad:</strong>
          <p>{{ health.uptime }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { ref, onMounted, computed } from 'vue';

interface HealthData {
  memory: {
    usage: string;
    used: string;
    total: string;
  };
  cpu: {
    brand: string;
    cores: number;
    load: string;
  };
  disks: Array<{
    filesystem: string;
    size: string;
    used: string;
    available: string;
    usage: string;
  }>;
  uptime: string;
}

export default {
  setup() {
    const health = ref<HealthData | null>(null);
    const loading = ref(true);

    const fetchHealth = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/healthcheck`);
        health.value = await res.json();
        loading.value = false;
      } catch (err) {
        console.error('Error fetching health data:', err);
      }
    };

    const getHealthStatus = (usage: string) => {
      const percentage = parseFloat(usage);
      if (percentage < 20) return 'Óptimo';
      if (percentage < 50) return 'Estable';
      if (percentage < 80) return 'No Óptimo';
      return 'Crítico';
    };

    const getHealthClass = (usage: string) => {
      const percentage = parseFloat(usage);
      if (percentage < 20) return 'health-optimo';
      if (percentage < 50) return 'health-estable';
      if (percentage < 80) return 'health-no-optimo';
      return 'health-critico';
    };

    const systemHealth = computed(() => {
      if (!health.value) return 'Desconocido';
      const memoryStatus = parseFloat(health.value.memory.usage);
      const cpuStatus = parseFloat(health.value.cpu.load);
      const diskStatuses = health.value.disks.map((disk) => parseFloat(disk.usage));

      const allStatuses = [memoryStatus, cpuStatus, ...diskStatuses];
      const average = allStatuses.reduce((acc, val) => acc + val, 0) / allStatuses.length;

      if (average < 20) return 'Óptimo';
      if (average < 50) return 'Estable';
      if (average < 80) return 'No Óptimo';
      return 'Crítico';
    });

    const systemHealthClass = computed(() => {
      switch (systemHealth.value) {
        case 'Óptimo':
          return 'health-optimo';
        case 'Estable':
          return 'health-estable';
        case 'No Óptimo':
          return 'health-no-optimo';
        case 'Crítico':
          return 'health-critico';
        default:
          return '';
      }
    });

    const systemHealthIcon = computed(() => {
      switch (systemHealth.value) {
        case 'Óptimo':
          return 'pi-check-circle';
        case 'Estable':
          return 'pi-check-circle';
        case 'No Óptimo':
          return 'pi-exclamation-triangle';
        case 'Crítico':
          return 'pi-times-circle';
        default:
          return '';
      }
    });

    onMounted(() => {
      fetchHealth();
    });

    return { health, loading, systemHealth, systemHealthClass, systemHealthIcon, getHealthStatus, getHealthClass };
  }
};
</script>


<style scoped>
/* Importar la fuente Poppins */
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600&display=swap');

h1 {
  text-align: center;
  margin-bottom: 2rem;
  font-size: 2.5rem;
  font-family: 'Poppins', sans-serif;
  color: hsla(160, 100%, 37%, 1);
}

.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 2rem;
}

.loading-bar {
  width: 100%;
  height: 8px;
  background-color: #e0e0e0;
  position: relative;
  overflow: hidden;
}

.loading-bar::before {
  content: '';
  position: absolute;
  width: 100%;
  height: 100%;
  background-color: #00c853;
  animation: loadingAnimation 1.5s infinite;
}

@keyframes loadingAnimation {
  0% {
    left: -100%;
  }

  50% {
    left: 50%;
  }

  100% {
    left: 100%;
  }
}

/* Animación de flujo constante para las barras de progreso */
.progress-bar-container {
  width: 100%;
  background-color: #e0e0e0;
  height: 25px;
  border-radius: 8px;
  margin: 0.5rem 0;
  position: relative;
  overflow: hidden;
}

.progress-bar {
  background-color: #00c853;
  height: 100%;
  border-radius: 8px;
  position: absolute;
  transition: width 0.5s ease-in-out;
}

.progress-bar-flowing {
  content: '';
  position: absolute;
  height: 100%;
  width: 50px;
  background: rgba(255, 255, 255, 0.3);
  animation: flowAnimation 1.5s linear infinite;
}

@keyframes flowAnimation {
  0% {
    left: 0%;
  }

  100% {
    left: 100%;
  }
}

/* Estilos del estado de salud */
.health-status {
  text-align: center;
  margin-bottom: 2rem;
}

.health-status-text {
  font-size: 1.5rem;
  font-family: 'Poppins', sans-serif;
}

.health-optimo {
  color: #00c853;
}

.health-estable {
  color: #76ff03;
}

.health-no-optimo {
  color: #ff9800;
}

.health-critico {
  color: #f44336;
}

.info-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  /* Configura 2 columnas iguales en pantallas grandes */
  gap: 1rem;
  /* Espacio entre las columnas y filas */
  justify-content: center;
  /* Centra los contenedores horizontalmente */
  align-items: center;
  /* Centra los contenedores verticalmente */
}

/* Media Query para pantallas móviles */
@media screen and (max-width: 768px) {
  .info-container {
    grid-template-columns: 1fr;
    /* Cambia a una sola columna en pantallas pequeñas */
  }
}

.progress-bars-column,
.info-column {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  /* Asegura que el gap entre los elementos sea de 1 */
}

.info-item {
  margin-bottom: 1.5rem;
  padding: 1rem;
  border: 1px solid hsla(160, 100%, 37%, 0.3);
  border-radius: 8px;
  transition: 0.3s;
  font-family: 'Poppins', sans-serif;
}

.info-item:hover {
  border-color: hsla(160, 100%, 37%, 1);
  background-color: hsla(160, 100%, 37%, 0.1);
}

.icon {
  margin-right: 0.5rem;
  font-size: 1.5rem;
  color: hsla(160, 100%, 37%, 1);
}

.system-summary {
  margin-top: 2rem;
  padding: 1rem;
  border: 1px solid hsla(160, 100%, 37%, 0.3);
  border-radius: 8px;
  background-color: hsla(160, 100%, 37%, 0.05);
  font-family: 'Poppins', sans-serif;
}

.system-summary h2 {
  font-size: 1.8rem;
  color: hsla(160, 100%, 37%, 1);
  margin-bottom: 1rem;
  text-align: center;
}

.system-summary ul {
  list-style: none;
  padding: 0;
}

.system-summary li {
  margin-bottom: 0.75rem;
  display: flex;
  align-items: center;
  font-size: 1.2rem;
}

.system-summary .icon {
  margin-right: 0.75rem;
  font-size: 1.5rem;
  color: hsla(160, 100%, 37%, 1);
}
</style>
