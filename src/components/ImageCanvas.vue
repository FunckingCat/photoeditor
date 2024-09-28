<template>
  <div class="canvas-container">
    <canvas
      id="canvas"
      class="canvas-editor"
      ref="canvas"
      @mousedown="handleMouseDown"
      @mousemove="handleMouseMove"
      @mouseup="handleMouseUp"
      @mouseleave="handleMouseLeave"
    ></canvas>
    <ModalColor
      class="canvas-modal"
      v-if="colorInfoPanelVisible"
      :selectedColor="selectedColors"
      :xMouse="selectedPixel.x"
      :yMouse="selectedPixel.y"
      @closeSetting="colorInfoPanelVisible = false"
    />
    <CorrectionsModal
      class="canvas-modal"
      v-if="correctionPanelVisible"
      :canvasRef="canvasRef || {}"
      :xMouse="offsetX"
      :yMouse="offsetY"
      :iw="displayImageWidth"
      :ih="displayImageHeight"
      :origImg="selectedImage"
      @update:origImg="origImg = $event"
      @renderImage="renderImage"
      @closeSetting="correctionPanelVisible = false"
    />
    <FiltrationModal
      class="canvas-modal"
      v-if="filtrPanelVisible"
      :canvasRef="canvasRef || {}"
      :xMouse="offsetX"
      :yMouse="offsetY"
      :iw="displayImageWidth"
      :ih="displayImageHeight"
      :origImg="selectedImage"
      @update:origImg="origImg = $event"
      @renderImage="renderImage"
      @closeSetting="filtrPanelVisible = false"
    />

    <ImageFooter
      :imageWidth="imageWidth"
      :imageHeight="imageHeight"
      :selectedColor="selectedColor"
      :selectedPixel="selectedPixel"
      :activeTool="activeTool"
      :selectedScale="selectedScale"
      @scale-change="handleScaleChange"
    />

    <div v-if="isModalVisible" class="modal">
      <div class="modal-content modal-content__wrapper" @click.stop>
        <h2 class="modal__title">Изменение размера изображения</h2>
        <div class="modal-content__item">
          <label for="interpolation-algorithm">Алгоритм интерполяции:</label>
          <select
            v-model="interpolationAlgorithm"
            id="interpolation-algorithm"
            class="transparent-input"
          >
            <option
              value="nearest-neighbor"
              title="Алгоритм ближайшего соседа используется для изменения размера изображения путем выбора цвета пикселя из оригинального 
  изображения, наиболее близкого к центру пикселя в новом изображении."
            >
              Ближайший сосед
            </option>
          </select>
        </div>
        <div class="modal-content__item">
          <label for="resizeType">Тип изменения:</label>
          <select
            v-model="resizeType"
            id="resizeType"
            class="transparent-input"
            @change="updateModal($event)"
          >
            <option value="percentage">Проценты</option>
            <option value="pixels">Пиксели</option>
          </select>
        </div>
        <div class="modal-content__item modal-content__ratio">
          <label class="modal-content__ratio-btn" for="maintainAspectRatio">
            <input
              type="checkbox"
              id="maintainAspectRatio"
              v-model="maintainAspectRatio"
            />
            Фиксировать соотношение сторон
          </label>
        </div>
        <div class="modal-content__item">
          <label for="width">Ширина:</label>
          <input
            type="number"
            :value="newWidth"
            id="width"
            min="1"
            class="transparent-input"
            @change="updateNewWidth"
          />
        </div>
        <div class="modal-content__item">
          <label for="height">Высота:</label>
          <input
            type="number"
            :value="newHeight"
            id="height"
            min="1"
            class="transparent-input"
            @change="updateNewHeight"
          />
        </div>
        <div class="modal-content__stat">
          <div>
            {{ ((imageWidth * imageHeight) / 1000000).toFixed(4) }} Мп
          </div>
          <div>=======></div>
          <div>
            {{ countPixels() }} Мп
          </div>
        </div>
        <div class="modal-content__item modal-content__button">
          <button @click="closeResizeModal">Отмена</button>
          <button @click="handleModalConfirm">Применить</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import ImageFooter from "./ImageFooter.vue";
import ModalColor from "./ModalColor.vue";
import CorrectionsModal from "./CorrectionsModal.vue";
import FiltrationModal from "./FiltrationModal.vue";
import { nearestNeighborInterpolation } from "@/nearestNeighborInterpolation.ts";
import { watch } from "vue";

export default {
  name: "ImageCanvas",
  components: {
    ImageFooter,
    ModalColor,
    CorrectionsModal,
    FiltrationModal,
  },
  emits: ["closeResizeModal"],
  data() {
    return {
      canvasRef: null,
      imageData: null,
      displayImageData: null,
      displayImage: null,
      imageWidth: 0,
      imageHeight: 0,
      displayImageWidth: 0,
      displayImageHeight: 0,
      selectedColor: null,
      selectedColors: "",
      selectedPixel: { x: 0, y: 0 },
      selectedScale: 100,
      isModalVisible: this.isResizeModalVisible,
      interpolationAlgorithm: "nearest-neighbor",
      resizeType: "pixels",
      newWidth: null,
      newHeight: null,
      maintainAspectRatio: false,
      aspectRatio: 1,
      widthPercent: null,
      heightPercent: null,
      colorInfoPanelVisible: false,
      canvasOffsetX: 0,
      offsetX: 0,
      offsetY: 0,
      canvasOffsetY: 0,
      dragging: false,
      correctionPanelVisible: false,
      filtrPanelVisible: false,
    };
  },
  props: {
    activeTool: String,
    selectedImage: String,
    isResizeModalVisible: Boolean,
  },
  mounted() {
    this.canvasRef = this.$refs.canvas;
    this.canvasRef.addEventListener("click", this.handleCanvasClick);
    window.addEventListener("keydown", this.handleKeyDown);
    window.addEventListener("keyup", this.handleKeyUp);
  },
  beforeUnmount() {
    window.removeEventListener("keydown", this.handleKeyDown);
    window.removeEventListener("keyup", this.handleKeyUp);
  },
  watch: {
    isResizeModalVisible(newValue) {
      this.isModalVisible = newValue;
      this.updateModal();
    },
    selectedImage() {
      this.selectedScale = 100;
      const img = new Image();
      img.crossOrigin = "";
      img.src = this.selectedImage;
      img.onload = () => {
        console.log("Image loaded");
        this.imageData = this.extractImageData(img);
        this.imageWidth = this.imageData.width;
        this.imageHeight = this.imageData.height;
        this.calcDisplayImageData();
        this.renderImage();
      }
    },
    activeTool(newValue) {
      if (newValue === "Пипетка") {
        this.colorInfoPanelVisible = true;
        this.correctionPanelVisible = false;
        this.filtrPanelVisible = false;
      }
      if (newValue === "Кривые") {
        this.colorInfoPanelVisible = false;
        this.correctionPanelVisible = true;
        this.filtrPanelVisible = false;
      }
      if (newValue === "Фильтрация") {
        this.colorInfoPanelVisible = false;
        this.correctionPanelVisible = false;
        this.filtrPanelVisible = true;
      }
    },
  },
  methods: {
    extractImageData(img) {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        return ctx.getImageData(0, 0, canvas.width, canvas.height);
    },
    handleMouseDown(event) {
      if (this.activeTool === "Рука") {
        this.dragging = true;
        this.lastX = event.clientX;
        this.lastY = event.clientY;
        event.preventDefault();
      }
    },
    handleMouseMove(event) {
      if (this.dragging) {
        const dx = event.clientX - this.lastX;
        const dy = event.clientY - this.lastY;

        this.lastX = event.clientX;
        this.lastY = event.clientY;

        this.canvasRef.style.cursor = "grabbing";

        // Обновление положения изображения без очистки и перерисовки
        this.canvasOffsetX += dx;
        this.canvasOffsetY += dy;

        // Перерисовка изображения с новыми координатами
        this.renderImage();

        event.preventDefault();
      }
    },
    handleMouseUp(event) {
      if (this.dragging && this.activeTool === "Рука") {
        this.dragging = false;
        this.canvasRef.style.cursor = "grab";
        event.preventDefault();
      }
    },
    handleMouseLeave(event) {
      if (this.dragging && this.activeTool === "Рука") {
        this.dragging = false;
        this.canvasRef.style.cursor = "grab";
        event.preventDefault();
      }
    },
    handleKeyDown(event) {
      if (this.activeTool === "Рука" && !this.dragging) {
        const shiftModifier = event.shiftKey ? 5 : 1; // Ускорение при зажатом Shift
        switch (event.key) {
          case "ArrowLeft":
            this.canvasOffsetX -= 10 * shiftModifier;
            break;
          case "ArrowRight":
            this.canvasOffsetX += 10 * shiftModifier;
            break;
          case "ArrowUp":
            this.canvasOffsetY -= 10 * shiftModifier;
            break;
          case "ArrowDown":
            this.canvasOffsetY += 10 * shiftModifier;
            break;
        }
        this.renderImage();
      }
    },
    calcDisplayImageData() {
      const inittialScaleFactor = this.calculateScaleFactor(this.imageWidth, this.imageHeight);
      const scaledWidth = Math.round(this.imageData.width * inittialScaleFactor * (this.selectedScale / 100));
      const scaledHeight = Math.round(this.imageData.height * inittialScaleFactor * (this.selectedScale / 100));
      this.displayImageData = this.scaleImageData(this.imageData, scaledWidth, scaledHeight);
    },
    renderImage() {

      console.log("renderImage: Enter");

      if (this.imageData == null) {
        console.log("renderImage: ImageData is null when render called");
        return ;
      }

      const img = this.imageData;
      const canvas = this.canvasRef;
      const ctx = this.canvasRef?.getContext("2d");
      const scrollX = this.$refs.canvas.parentNode.scrollLeft;
      const scrollY = this.$refs.canvas.parentNode.scrollTop;
      const canvasWidth = this.canvasRef.clientWidth;
      const canvasHeight = this.canvasRef.clientHeight;

      console.log(`W${canvasWidth} H${canvasHeight} CW${canvas.width} CH${canvas.height}`)

      // ctx.clearRect(0, 0, canvas.width, canvas.height);
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;

      const inittialScaleFactor = this.calculateScaleFactor(this.imageWidth, this.imageHeight);
      const scaledWidth = Math.round(img.width * inittialScaleFactor * (this.selectedScale / 100));
      const scaledHeight = Math.round(img.height * inittialScaleFactor * (this.selectedScale / 100));

      console.log(`Scaling: ${img.width},${this.inittialScaleFactor},${this.selectedScale},${scaledWidth}`);

      let x = Math.round((canvasWidth - scaledWidth) / 2) + this.canvasOffsetX - scrollX;
      let y = Math.round((canvasHeight - scaledHeight) / 2) + this.canvasOffsetY - scrollY;

      this.offsetX = x;
      this.offsetY = y;

      this.displayImageWidth = scaledWidth;
      this.displayImageHeight = scaledHeight;

      // Добавляем отступы
      const margin = 10;
      x = Math.min(Math.max(x, - scaledWidth + margin), canvasWidth - margin);
      y = Math.min(Math.max(y, - scaledHeight + margin), canvasHeight - margin);

      const aspectRatio = this.imageWidth / this.imageHeight;
      this.aspectRatio = aspectRatio;

      ctx.putImageData(this.displayImageData, x, y);

    },
    scaleImageData(imageData, width, height) {
      const scaledImageData = new ImageData(width, height);
      const scaleWidth = width / imageData.width;
      const scaleHeight = height / imageData.height;

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const srcX = Math.floor(x / scaleWidth);
          const srcY = Math.floor(y / scaleHeight);
          const srcIndex = (srcY * imageData.width * 4) + (srcX * 4);
          const destIndex = (y * width * 4) + (x * 4);

          scaledImageData.data[destIndex] = imageData.data[srcIndex];
          scaledImageData.data[destIndex + 1] = imageData.data[srcIndex + 1];
          scaledImageData.data[destIndex + 2] = imageData.data[srcIndex + 2];
          scaledImageData.data[destIndex + 3] = imageData.data[srcIndex + 3];
        }
      }

      return scaledImageData;
    },   
    calculateScaleFactor(originalWidth, originalHeight) {
      const canvas = this.$refs.canvas;
      const minMargin = 50;
      const availableWidth = this.canvasRef.clientWidth - 2 * minMargin;
      const availableHeight = this.canvasRef.clientHeight - 2 * minMargin;

      const widthScaleFactor = availableWidth / originalWidth;
      const heightScaleFactor = availableHeight / originalHeight;

      return Math.min(widthScaleFactor, heightScaleFactor);
    },
    handleCanvasClick(event) {
      const canvasRect = this.$refs.canvas.getBoundingClientRect();
      const canvasOffsetX = (this.canvasRef.clientWidth - this.imageWidth) / 2;
      const canvasOffsetY =
        (this.canvasRef.clientHeight - this.imageHeight) / 2;

      if (this.activeTool === "Пипетка") {
        const x = Math.round(event.clientX - canvasRect.left - canvasOffsetX);
        const y = Math.round(event.clientY - canvasRect.top - canvasOffsetY);
        this.selectedPixel = { x, y };
        this.updateSelectedColor();
      }
    },

    updateSelectedColor() {
      const x = this.selectedPixel.x;
      const y = this.selectedPixel.y;

      // Координаты относительно изображения
      const imageX = x + (this.canvasRef.clientWidth - this.imageWidth) / 2;
      const imageY = y + (this.canvasRef.clientHeight - this.imageHeight) / 2;

      const ctx = this.canvasRef.getContext("2d");
      const pixelData = ctx.getImageData(imageX, imageY, 1, 1).data;
      const r = pixelData[0];
      const g = pixelData[1];
      const b = pixelData[2];
      this.selectedColors = `rgb(${r}, ${g}, ${b})`;
      this.selectedColor = { r, g, b };
    },
    handleModalConfirm() {

      let scaledWidth = this.newWidth;
      let scaledHeight = this.newHeight;

      if (this.resizeType === "percentage") {
        scaledWidth = Math.round((this.newWidth / 100) * this.imageWidth);
        scaledHeight = Math.round((this.newHeight / 100) * this.imageHeight);
      }

      this.imageData = nearestNeighborInterpolation(
        this.imageData,
        scaledWidth,
        scaledHeight
      );

      this.imageWidth = this.imageData.width;
      this.imageHeight = this.imageData.height;

      this.calcDisplayImageData();
      this.renderImage();

      this.closeResizeModal();
    },
    updateModal() {
      if (this.resizeType === "pixels") {
        this.newWidth = this.imageWidth;
        this.newHeight = this.imageHeight;
        const aspectRatio = this.imageWidth / this.imageHeight;
        this.aspectRatio = aspectRatio;
      } else if (this.resizeType === "percentage") {
        this.aspectRatio = 1;
        this.widthPercent = this.newWidth;
        this.heightPercent = this.newHeight;
        this.newWidth = 100;
        this.newHeight = 100;
      }
    },
    updateNewWidth(event) {
      let value = Math.floor(+event.target.value); // Преобразование в число и округление в меньшую сторону
      if (value <= 0) value = 1; // Убеждаемся, что значение не меньше 1
      if (value > 7680) value = 7680; // Ограничиваем значение до 7680 (ширина 8K)
      this.newWidth = value;
      if (this.maintainAspectRatio) {
        this.newHeight = Math.round(value / this.aspectRatio);
      }
    },

    updateNewHeight(event) {
      let value = Math.floor(+event.target.value); // Преобразование в число и округление в меньшую сторону
      if (value <= 0) value = 1; // Убеждаемся, что значение не меньше 1
      if (value > 4320) value = 4320; // Ограничиваем значение до 4320 (высота 8K)
      this.newHeight = value;
      if (this.maintainAspectRatio) {
        this.newWidth = Math.round(value * this.aspectRatio);
      }
    },
    countPixels() {
      if (this.resizeType === "pixels") {
        return ((this.newWidth * this.newHeight) / 1000000).toFixed(4);
      }
      if (this.resizeType === "percentage") {
        const width = this.imageWidth;
        const height = this.imageHeight;
        const percentage = width * height;
        return (
          ((this.newWidth / 100) * (this.newHeight / 100) * percentage) /
          1000000
        ).toFixed(4);
      }
    },
    handleScaleChange(scale) {
      this.selectedScale = scale;
      this.calcDisplayImageData();
      this.renderImage();
    },
    closeResizeModal() {
      this.isModalVisible = false;
      this.$emit("closeResizeModal");
      this.$emit("update:activeTool", "");
    },

    // Сохранение
    saveImage() {

      if (this.imageData == null) {
        return ;
      }

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      canvas.width = this.imageWidth;
      canvas.height = this.imageHeight;
      ctx.putImageData(this.imageData,0,0);
      const link = document.createElement("a");
      link.href = canvas.toDataURL("image/png");
      link.download = "my_image.png";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    },
  },
};
</script>

<style scoped>
.canvas-container {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 100vh;
  flex: 1;
}

.canvas-editor {
  height: calc(100% - 25px);
  width: 100%;
}

.canvas-modal {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  width: 220px;
  z-index: 1000;
  overflow-y: auto;
  padding: 20px;
}
.modal {
  display: flex;
  justify-content: center;
  align-items: center;
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  /* Прозрачный черный фон */
  z-index: 1000;
}

.transparent-input {
  width: 65%;
  padding: 5px;
  margin-top: 5px;
  border: 1px solid #fff;
  background-color: transparent;
  color: #fff;
  border-radius: 5px;
}

.transparent-input:focus {
  outline: none;
}

.modal-content__wrapper {
  background-color: rgba(115, 89, 130, 0.8);
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
  max-width: 620px;
  width: 100%;
  color: #fff;
}

.modal-content__item {
  margin-bottom: 15px;
  display: flex;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
}

.modal-content__stat {
  margin-bottom: 15px;
  display: flex;
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  gap: 10px;
}

.modal-content__ratio {
  display: flex;
  align-items: center;
}

.modal-content__ratio .modal-content__ratio-btn {
  display: flex;
  align-items: center;
}

.modal-content__ratio .modal-content__ratio-btn input[type="checkbox"] {
  margin-right: 5px;
  flex-shrink: 0;
}

.modal-content__button {
  display: flex;
  justify-content: space-around;
}

.modal-content__button button {
  padding: 10px 20px;
  border: 1px solid #fff;
  background-color: transparent;
  color: #fff;
  cursor: pointer;
  border-radius: 5px;
  transition: background-color 0.3s, border-color 0.3s;
}

.modal-content__button button {
  width: 40%;
}

.modal-content__button button:hover {
  background-color: #fff;
  color: #000;
}

.modal__title {
  text-align: center;
}

</style>
