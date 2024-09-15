<template>
  <aside class="sidebar">
    <div @click="openModalUpload">
      <img
        src="../assets/icons/folder.png"
        alt="Upload"
        class="file-upload-icon"
      />
    </div>
    <div
      v-for="tool in tools"
      :key="tool.id"
      @click="toggleToolActivation(tool)"
      :class="{ active: activeTool === tool.name }"
    >
      <img
        class="tool__icon"
        :src="tool.icon"
        :alt="tool.name"
        @mouseover="showTooltip(tool.name)"
        @mouseleave="hideTooltip"
      />
      <span
        class="tooltip"
        v-if="showTooltipFlag && currentTool === tool.name"
        >{{ tool.name }}</span
      >
    </div>
    <div @click="saveImage">
      <img
        src="../assets/icons/save.png"
        alt="Save images"
        title="Скачать изображение"
        class="file-upload-icon"
      />
    </div>
  </aside>
  <div v-if="isModalVisible" @click="closeModal" class="modal">
    <div class="modal-content" @click.stop>
      <div class="upload__cont">
        <img
          src="../assets/icons/search.png"
          alt="Upload"
          class="file-upload-button"
          @click="openFileInput"
        />
        <div class="or"> или </div>
        <input
          ref="fileInput"
          id="file-upload"
          type="file"
          accept="image/*"
          @change="handleFileUpload"
          style="display: none"
        />
        <div class="url-upload-container">
          <input
            id="image-url"
            type="text"
            v-model="imageUrl"
            placeholder="Введите URL изображения"
            class="upload-button url-input"
          />
          <button @click="loadImageFromUrl" class="upload-button">Загрузить</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "sidebar-menu",
  emits: [
    "imageSelected",
    "update:activeTool",
    "image-selected",
    "openResizeModal",
  ],
  props: {
    activeTool: String,
  },
  data() {
    return {
      tools: [
        {
          id: 1,
          name: "Пипетка",
          icon: require("../assets/icons/pipette.png"),
        },
        {
          id: 2,
          name: "Изменение размера",
          icon: require("../assets/icons/enlarge.png"),
        },
        {
          id: 3,
          name: "Рука",
          icon: require("../assets/icons/hand.png"),
        },
        {
          id: 4,
          name: "Кривые",
          icon: require("../assets/icons/curve.png"),
        },
        {
          id: 5,
          name: "Фильтрация",
          icon: require("../assets/icons/filtering.png"),
        },
      ],
      showTooltipFlag: false,
      currentTool: "",
      isModalVisible: false,
      imageUrl: "",
    };
  },
  methods: {
    toggleToolActivation(tool) {
      this.$emit(
        "update:activeTool",
        this.activeTool === tool.name ? "" : tool.name
      );
      if (tool.name === "Изменение размера") {
        this.$emit("openResizeModal");
      }
    },
    showTooltip(toolName) {
      this.showTooltipFlag = true;
      this.currentTool = toolName;
    },
    hideTooltip() {
      this.showTooltipFlag = false;
      this.currentTool = "";
    },
    openModalUpload() {
      this.isModalVisible = true;
    },
    closeModal() {
      this.isModalVisible = false;
    },
    openFileInput() {
      this.$refs.fileInput.click();
    },
    handleFileUpload(event) {
      const target = event.target;
      const selectedFile = target.files?.[0];

      if (selectedFile) {
        const imageUrl = URL.createObjectURL(selectedFile);
        this.selectedImage = imageUrl;
        this.$emit("image-selected", imageUrl);

        target.value = "";
      }
      this.closeModal();
    },
    loadImageFromUrl() {
      this.$emit("image-selected", this.imageUrl);
      this.selectedImage = this.imageUrl;
      this.imageUrl = "";
      this.closeModal();
    },
    saveImage() {
      this.$emit("save-image");
    },
  },
  beforeUnmount() {
    if (this.selectedImage) {
      URL.revokeObjectURL(this.selectedImage);
    }
  },
};
</script>

<style scoped>
.sidebar {
  position: absolute;
  min-width: 55px;
  background-color: #535353;
  padding: 10px;
  /* height: 100vh; */
  top: 40%;

  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: 5px;
}

.sidebar div {
  cursor: pointer;
  padding: 5px;
  margin-bottom: 5px;
  border-radius: 3px;
  border: solid 1px rgb(220, 182, 255);
  background-color: #715d78;
  position: relative;
  width: 35px;
  height: 35px;
}

.tooltip {
  position: absolute;
  background-color: #f4e8ff;
  color: rgb(149, 35, 255);
  border: solid 1px;
  border-radius: 3px;
  padding: 2px;
  left: 100%;
  transform: translateX(-10%);
  white-space: nowrap;
  display: none;
  z-index: 999;
}

.sidebar div:hover .tooltip {
  display: block;
}

.sidebar div.active {
  background-color: #383838;
}
.modal {
  top: 0;
  bottom: 0;
  right: 0;
  left: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 999;
  position: fixed;
  display: flex;
}

.modal-content {
  background-color: #63506d;
  width: 450px;
  height: 100px;
  border-radius: 10px;
  margin: auto;
  padding: 20px;
}
.tool__icon {
  width: 23px;
  height: 21px;
}
.upload__cont {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.url-upload-container {
  display: flex;
  gap: 10px;
}

.url-upload-container input[type="text"] {
  flex: 1;
}

.url-upload-container button {
  cursor: pointer;
}

.or {
  color: white;
}

.file-upload-button {
  cursor: pointer;
  border: solid 1px rgb(220, 182, 255);
  background-color: #715d78;
  border-radius: 3px;
  width: 36px;
  height: 36px;
  padding: 5px;
  margin: 10px;
}
.file-upload-icon {
  height: 20.84px;
}
input[type="file"] {
  display: none;
}

.upload-button {
  padding: 5px;
  border: solid 1px rgb(220, 182, 255);
  background-color: #ffffff;
  border-radius: 3px;
}

.url-input {
  width: 200px;
}
</style>
