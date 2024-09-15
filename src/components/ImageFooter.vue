<template>
  <div class="footer">
    <div class="image-stat">
      <div v-if="imageWidth && imageHeight" class="image-info">
        Размер: {{ imageWidth }}px x {{ imageHeight }}px;
      </div>
      <div v-if="selectedColor" class="color-info">
        RGB ({{ selectedColor.r }}, {{ selectedColor.g }},
        {{ selectedColor.b }})
        <div
          class="color-preview"
          :style="{
            backgroundColor: `rgb(${selectedColor.r},${selectedColor.g},${selectedColor.b})`,
          }"
        ></div>
        Координаты ({{ selectedPixel.x }}; {{ selectedPixel.y }})
      </div>
    </div>

    <div class="scale-selector">
      <select v-model="localScale" @change="handleScaleChange">
        <option v-for="(scale, index) in scales" :key="index" :value="scale">
          {{ scale }}%
        </option>
      </select>
    </div>
  </div>
</template>

<script>
export default {
  name: "ImageFooter",
  props: {
    imageWidth: Number,
    imageHeight: Number,
    selectedColor: Object,
    selectedPixel: Object,
    selectedScale: Number,
  },
  data() {
    return {
      localScale: this.selectedScale,
      scales: [12, 25, 50, 75, 100, 150, 200, 300],
    };
  },
  methods: {
    handleScaleChange() {
      this.$emit("scale-change", this.localScale);
    },
  },
};
</script>

<style scoped>
.footer {
  background-color: #535353;
  color: white;
  height: 25px;
  display: flex;
  justify-content: space-between;
  gap: 15px;
  width: 100%;
}
.image-stat {
  margin-left: 40px;
  display: flex;
  gap: 10px;
}

.image-info,
.color-info {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 15px;
}

.color-preview {
  width: 16px;
  height: 16px;
}
.scale-selector select {
  background-color: #535353;
  color: white;
  border: none;
  outline: none;
  cursor: pointer;
}
</style>
