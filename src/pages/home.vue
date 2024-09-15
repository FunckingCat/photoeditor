<template>
  <div>
    <div class="content">
      <Sidebar
        v-model:activeTool="activeTool"
        @image-selected="handleImageSelected"
        @openResizeModal="handleOpenResizeModal"
        @save-image="saveImage"
      />
      <ImageCanvas
        :activeTool="activeTool"
        :selectedImage="selectedImage"
        @color-selected="handleColorSelected"
        :isResizeModalVisible="isResizeModalVisible"
        @closeResizeModal="handleCloseResizeModal"
        ref="imageCanvas"
      />
    </div>
  </div>
</template>

<script>
import ImageCanvas from "../components/ImageCanvas.vue";
import Sidebar from "../components/Sidebar.vue";

export default {
  name: "HomePage",
  components: {
    ImageCanvas,
    Sidebar,
  },
  data() {
    return {
      activeTool: "",
      selectedImage: null,
      selectedColor: null,
      isResizeModalVisible: false,
    };
  },
  methods: {
    handleImageSelected(imageData) {
      this.selectedImage = imageData;
    },
    handleColorSelected(colorData) {
      this.selectedColor = colorData;
    },
    handleOpenResizeModal() {
      this.isResizeModalVisible = true;
    },
    handleCloseResizeModal() {
      this.isResizeModalVisible = false;
    },
    saveImage() {
      this.$refs.imageCanvas.saveImage();
    },
  },
};
</script>

<style scoped>
.content {
  display: flex;
  align-items: flex-end;
  width: 100%;
  height: 100%;
  background-color: #383838;
}
</style>
