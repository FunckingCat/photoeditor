<template>
  <aside class="sidebar">
    <div class="panel-header">
      <button class="close-button" @click="closeSetting">
        <img src="@/assets/icons/crest.png" />
      </button>
    </div>
    <div class="input-fields">
      <div class="input-fields-wrapper">
        <div class="input-fields-i">
          <label for="input1">X1:</label>
          <input id="input1" :value="input1" @change="updateX1" />
        </div>
        <div class="input-fields-i">
          <label for="output1">Y1:</label>
          <input id="output1" :value="output1" @change="updateY1" />
        </div>
      </div>
      <div class="hrhr"></div>
      <div class="input-fields-wrapper">
        <div class="input-fields-i">
          <label for="input2">X2:</label>
          <input id="input2" :value="input2" @change="updateX2" />
        </div>
        <div class="input-fields-i">
          <label for="output2">Y2:</label>
          <input id="output2" :value="output2" @change="updateY2" />
        </div>
      </div>
    </div>
    <div class="buttons">
      <label class="prewiew_label">
        <input type="checkbox" class="prewiew_input" v-model="togglePreview"/>
        Превью
      </label>
      <button class="apply-button" @click="applyCorrection">Применить</button>
      <button class="reset-button" @click="resetValues">Сброс</button>
    </div>
    <div class="curve-chart">
      <canvas id="chart" width="100" height="100" ref="chart"></canvas>
    </div>
  </aside>
</template>

<script>
import Chart from "chart.js/auto";
import { watch } from "vue";

export default {
  name: "sidebar-correction",

  props: {
    xMouse: Number,
    yMouse: Number,
    origImg: Object,
    ih: Number,
    iw: Number,
    canvasRef: Object,
  },
  data() {
    return {
      chartInstance: null,
      imgCorrected: false,
      input1: 0,
      output1: 0,
      input2: 255,
      output2: 255,
      togglePreview: false,
    };
  },
  mounted() {
    this.chartRef = this.$refs.chart;
  },
  methods: {
    closeSetting() {
      this.$emit("closeSetting");
    },
    normalizeHistogram(histogram) {
      const max = Math.max(...histogram);
      return histogram.map((value) => (value / max) * 255);
    },
    buildGraph() {
      const img = new Image();
      img.onload = () => {
        const ctx = this.canvasRef?.getContext("2d");
        try {
          const imageData = ctx.getImageData(
            this.xMouse,
            this.yMouse,
            this.iw,
            this.ih
          );
          const data = imageData.data;
          const redHistogram = new Array(256).fill(0);
          const greenHistogram = new Array(256).fill(0);
          const blueHistogram = new Array(256).fill(0);

          for (let i = 0; i < data.length; i += 4) {
            const red = data[i];
            const green = data[i + 1];
            const blue = data[i + 2];
            redHistogram[red]++;
            greenHistogram[green]++;
            blueHistogram[blue]++;
          }

          // Normalized
          const normalizedRedHistogram = this.normalizeHistogram(redHistogram);
          const normalizedGreenHistogram =
            this.normalizeHistogram(greenHistogram);
          const normalizedBlueHistogram =
            this.normalizeHistogram(blueHistogram);
          this.renderCurveChart(
            normalizedRedHistogram,
            normalizedGreenHistogram,
            normalizedBlueHistogram
          );
        } catch (e) {
          console.log(e);
        }
      };
      img.src = this.origImg;
    },
    renderCurveChart(redHistogram, greenHistogram, blueHistogram) {
      const ctx = this.chartRef?.getContext("2d");

      if (this.chartInstance) {
        this.chartInstance.destroy();
      }

      this.chartInstance = new Chart(ctx, {
        type: "line",
        data: {
          labels: Array.from({ length: 256 }, (_, i) => i),
          datasets: [
            {
              label: "R",
              data: redHistogram,
              backgroundColor: "rgba(255, 0, 0, 1)",
              borderWidth: 1,
              fill: false,
            },
            {
              label: "G",
              data: greenHistogram,
              backgroundColor: "rgba(0, 255, 0, 1)",
              borderWidth: 1,
              fill: false,
            },
            {
              label: "B",
              data: blueHistogram,
              backgroundColor: "rgba(0, 0, 255, 1)",
              borderWidth: 1,
              fill: false,
            },
            {
              label: "Линия",
              data: [
                { x: 0, y: this.output1 },
                { x: this.input1, y: this.output1 },
                { x: this.input2, y: this.output2 },
                { x: 255, y: this.output2 },
              ],
              borderColor: "rgba(255, 255, 255, 1)",
              borderWidth: 2,
              fill: false,
              tension: 0, // No curve, straight lines
            },
          ],
        },
        options: {
          plugins: {
            legend: {
              labels: {
                color: "white",
              },
            },
          },
          animation: false,
          aspectRatio: 1, // Ensures the chart is square
          scales: {
            x: {
              display: true,
              min: 0,
              max: 255,
              type: "linear", // Ensure numerical scaling
              ticks: {
                color: "white",
              },
            },
            y: {
              display: true,
              min: 0,
              max: 255,
              type: "linear", // Ensure numerical scaling
              ticks: {
                color: "white",
              },
            },
          },
        },
      });
    },

    calculateCorrection() {
      try {
        const lut = [];
        for (let i = 0; i < this.input1; i++) {
          lut[i] = this.output1;
        }
        for (let i = this.input1; i < this.input2; i++) {
          const slope =
            (this.output2 - this.output1) / (this.input2 - this.input1); // Угловой коэф.
          let correctedValue = this.output1 + slope * (i - this.input1);
          correctedValue = Math.max(0, Math.min(255, correctedValue));
          lut[i] = correctedValue;
        }
        for (let i = this.input2; i < 256; i++) {
          lut[i] = this.output2;
        }

        const ctx = this.canvasRef?.getContext("2d");
        const imageData = ctx.getImageData(
          this.xMouse,
          this.yMouse,
          this.iw,
          this.ih
        );
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
          data[i] = lut[data[i]]; // Коррекция красного канала
          data[i + 1] = lut[data[i + 1]]; // Коррекция зеленого канала
          data[i + 2] = lut[data[i + 2]]; // Коррекция синего канала
        }

        ctx.putImageData(imageData, this.xMouse, this.yMouse);
        this.imgCorrected = true;
      } catch (e) {
        console.log(e);
      }
    },
    revertCorrection() {
      this.buildGraph();
      this.togglePreview = false;
      this.$emit("renderImage");
    },
    applyCorrection() {
      this.closeSetting();
      this.calculateCorrection();
      this.buildGraph();
    },
    resetValues() {
      this.input1 = 0;
      this.output1 = 0;
      this.input2 = 255;
      this.output2 = 255;
      this.revertCorrection();
    },
    updateX1(event) {
      const num = +event.target.value;

      if (!isNaN(num) && num >= 0 && num < this.input2) {
        this.input1 = num;
        this.buildGraph();
      } else {
        this.input1 += 1;
        this.input1 -= 1;
      }
    },
    updateY1(event) {
      const num = +event.target.value;

      if (!isNaN(num) && num >= 0 && num <= 255) {
        this.output1 = num;
        this.buildGraph();
      } else {
        this.output1 += 1;
        this.output1 -= 1;
      }
    },
    updateX2(event) {
      const num = +event.target.value;

      if (!isNaN(num) && num <= 255 && this.input1 <= num) {
        this.input2 = num;
        this.buildGraph();
      } else {
        this.input2 += 1;
        this.input2 -= 1;
      }
    },
    updateY2(event) {
      const num = +event.target.value;

      if (!isNaN(num) && num <= 255 && 0 <= num) {
        this.output2 = num;
        this.buildGraph();
      } else {
        this.output2 += 1;
        this.output2 -= 1;
      }
    },
  },
  watch: {
    newImg() {
      this.buildGraph();
    },
    togglePreview(newVal) {
      if (newVal) {
        this.calculateCorrection();
      } else {
        this.revertCorrection();
      }
    },
  },
};

</script>

<style scoped>
.sidebar {
  min-width: 320px;
  background-color: #535353;
  padding: 10px;
  height: calc(100vh - 25px);
  border-bottom: 2px solid #383838;
}
.panel-header {
  display: flex;
  justify-content: end;
}

.close-button {
  cursor: pointer;
  color: #fff;
  background: transparent;
  width: 24px;
  height: 24px;
}
.input-fields {
  margin-top: 20px;
}

.input-fields-wrapper {
  color: #fff;
  display: flex;
  justify-content: space-around;
  margin-bottom: 10px;
  border-radius: 5px;
}
.input-fields-i {
  display: flex;
  max-width: 50px;
}

.corrections-preview {
  display: flex;
  justify-content: center;
  margin: 10px;
}

.preview-active {
  opacity: 0.6;
}
.buttons {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  margin-top: 10px;
  gap: 10px;
}

.apply-button,
.reset-button {
  background-color: transparent;
  color: white;
  border: 1px solid white;
  border-radius: 5px;
  padding: 5px 5px;
  cursor: pointer;
}

.apply-button:hover,
.reset-button:hover {
  background-color: rgba(255, 255, 255, 0.1);
}
.curve-chart {
  font-size: small;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 10px;
}

input {
  background-color: transparent;
  color: white;
  padding-left: 5px;
  width: 50px;
}

.prewiew_label {
  color: white
}

.hrhr {
  width: 100%;
  height: 2px;
  background-color: #fff;
  margin-bottom: 15px;
}

</style>
