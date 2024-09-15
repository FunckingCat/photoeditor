<template>
  <aside class="sidebar">
    <div class="panel-header">
      <button class="close-button" @click="closeSetting">
        <img src="@/assets/icons/crest.png" />
      </button>
    </div>
    <div class="colors"></div>
    <div class="colors-info">
      <div class="colors-picked">
        <input
          v-model="pickedButton"
          value="button1"
          type="radio"
          class="color-button"
          :style="{ background: color1 }"
        />
        <div class="color-parameters">
          <p>{{ color1X }}</p>
          <p>:</p>
          <p>{{ color1Y }}</p>
        </div>
      </div>
      <div class="colors-picked">
        <input
          v-model="pickedButton"
          value="button2"
          type="radio"
          class="color-button"
          :style="{ background: color2 }"
        />
        <div class="color-parameters">
          <p>{{ color2X }}</p>
          <p>:</p>
          <p>{{ color2Y }}</p>
        </div>
      </div>
      <div class="colors-table">
        <div class="colors-table-info">
          <div
            class="color-parameter"
            @mouseenter="showTooltipFlag = true"
            @mouseleave="showTooltipFlag = false"
          >
            RGB
            <div class="tooltip" v-if="showTooltipFlag">
              <div>RGB: Цветовая модель, сочетающая интенсивность красного, зеленого и синего света для создания цветов на цифровых дисплеях.</div>
              <div>XYZ: Стандартное цветовое пространство, представляющее зрительное
              восприятие цветов человеком, используется в качестве основы для
              других цветовых пространств.</div>
              <div>Lab: Воспринимаемое однородное цветовое пространство с компонентами
              яркости (L*) и осями контраста цвета (a*, b*), идеально
              подходящими для точной цветопередачи и коррекции.</div>
            </div>
        </div>
          <div class="color-parameters">
            <div class="color-param">
              <p v-for="value in color1RGB.split(',')" :key="value">
                {{ value.trim() }}
              </p>
            </div>
            <div class="color-param">
              <p v-for="value in color2RGB.split(',')" :key="value">
                {{ value.trim() }}
              </p>
            </div>
          </div>
        </div>
      </div>
      <div class="colors-table-info">
          <p
            class="color-parameter"
            @mouseenter="showTooltipFlag = true"
            @mouseleave="showTooltipFlag = false"
          >
            XYZ
          </p>
          <div class="color-parameters">
            <div class="color-param">
              <p v-for="value in color1XYZ.split(',')" :key="value">
                {{ value.trim() }}
              </p>
            </div>
            <div class="color-param">
              <p v-for="value in color2XYZ.split(',')" :key="value">
                {{ value.trim() }}
              </p>
            </div>
          </div>
        </div>
      <div class="colors-table">
        <div class="colors-table-info">
          <p
            class="color-parameter"
            @mouseenter="showTooltipFlag = true"
            @mouseleave="showTooltipFlag = false"
          >
            Lab
          </p>
          <div class="color-parameters">
            <div class="color-param">
              <p v-for="value in color1Lab.split(',')" :key="value">
                {{ value.trim() }}
              </p>
            </div>
            <div class="color-param">
              <p v-for="value in color2Lab.split(',')" :key="value">
                {{ value.trim() }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div
      class="contrast"
      v-if="contrast"
      :style="{ color: contrast < 4.5 ? 'red' : 'white' }"
    >
      Контраст: {{ contrast }}:1
    </div>
  </aside>
</template>

<script>
export default {
  name: "sidebar-setting",

  props: {
    selectedColor: String,
    xMouse: Number,
    yMouse: Number,
  },
  data() {
    return {
      pickedButton: null,
      color1: null,
      color2: null,
      color1X: 0,
      color1Y: 0,
      color2X: 0,
      color2Y: 0,
      color1RGB: "",
      color2RGB: "",
      color1XYZ: "",
      color2XYZ: "",
      color1Lab: "",
      color2Lab: "",
      contrast: null,
      showTooltipFlag: false,
    };
  },
  methods: {
    // Настройка пипетки
    closeSetting() {
      this.$emit("closeSetting");
    },
    updateColors() {
      const rgb = this.parseColor(this.selectedColor);
      const xyz = this.rgbToXyz(rgb);
      const lab = this.xyzToLab(xyz);
      if (this.pickedButton === "button1") {
        this.color1X = this.xMouse;
        this.color1Y = this.yMouse;
        this.color1RGB = this.prettyColor(rgb, true);
        this.color1XYZ = this.prettyColor(xyz);
        this.color1Lab = this.prettyColor(lab);
      } else {
        this.color2X = this.xMouse;
        this.color2Y = this.yMouse;
        this.color2RGB = this.prettyColor(rgb, true);
        this.color2XYZ = this.prettyColor(xyz);
        this.color2Lab = this.prettyColor(lab);
      }

      if (this.color1 && this.color2) {
        this.contrast = this.calculateContrastRatio(this.color1, this.color2);
      }
    },
    prettyColor([tone1, tone2, tone3], isRGB = false) {
      if (isRGB) return `${tone1}, ${tone2}, ${tone3}`;
      return `${tone1.toFixed(1)}, ${tone2.toFixed(1)}, ${tone3.toFixed(1)}`;
    },
    calculateContrastRatio(color1, color2) {
      const sRGBToLinear = (c) => {
        c = c / 255;
        return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
      };

      const getLuminance = (color) => {
        const rgb = this.parseColor(color);
        const r = sRGBToLinear(rgb[0]);
        const g = sRGBToLinear(rgb[1]);
        const b = sRGBToLinear(rgb[2]);
        return 0.2126 * r + 0.7152 * g + 0.0722 * b;
      };

      const luminance1 = getLuminance(color1);
      const luminance2 = getLuminance(color2);

      const maxLuminance = Math.max(luminance1, luminance2);
      const minLuminance = Math.min(luminance1, luminance2);

      const contrastRatio = (maxLuminance + 0.05) / (minLuminance + 0.05);

      return contrastRatio.toFixed(1);
    },
    parseColor(input) {
      if (input.substr(0, 1) == "#") {
        var collen = (input.length - 1) / 3;
        var fact = [17, 1, 0.062272][collen - 1];
        return [
          Math.round(parseInt(input.substr(1, collen), 16) * fact),
          Math.round(parseInt(input.substr(1 + collen, collen), 16) * fact),
          Math.round(parseInt(input.substr(1 + 2 * collen, collen), 16) * fact),
        ];
      } else
        return input
          .split("(")[1]
          .split(")")[0]
          .split(",")
          .map((x) => +x);
    },
    rgbToXyz(rgb) {
      let r = rgb[0] / 255;
      let g = rgb[1] / 255;
      let b = rgb[2] / 255;

      // Применяем коррекцию для RGB пространства
      r = r > 0.04045 ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92;
      g = g > 0.04045 ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92;
      b = b > 0.04045 ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92;

      // Применяем коэффициенты преобразования
      r *= 100;
      g *= 100;
      b *= 100;

      // Вычисляем XYZ
      const x = Math.round(r * 0.4124 + g * 0.3576 + b * 0.1805);
      const y = Math.round(r * 0.2126 + g * 0.7152 + b * 0.0722);
      const z = Math.round(r * 0.0193 + g * 0.1192 + b * 0.9505);

      return [x, y, z];
    },

    xyzToLab(xyz) {
      const [x, y, z] = xyz;

      // Коэффициенты для преобразования
      const xn = 95.047;
      const yn = 100.0;
      const zn = 108.883;

      const fx = x / xn;
      const fy = y / yn;
      const fz = z / zn;

      const epsilon = 0.008856;
      const kappa = 903.3;

      const f = (t) =>
        t > epsilon ? Math.pow(t, 1 / 3) : (kappa * t + 16) / 116;

      const L = Math.round(116 * f(fy) - 16);
      const a = Math.round(500 * (f(fx) - f(fy)));
      const b = Math.round(200 * (f(fy) - f(fz)));

      return [L, a, b];
    },
  },
  watch: {
    selectedColor(newVal) {
      if (this.pickedButton === "button1") {
        this.color1 = newVal;
        this.updateColors();
      }
      if (this.pickedButton === "button2") {
        this.color2 = newVal;
        this.updateColors();
      }
    },
  },
};
</script>

<style scoped>
.sidebar {
  padding-top: 40px;
  min-width: 220px;
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
  margin-bottom: 20px;
}

.colors {
  display: flex;
  justify-content: space-evenly;
  color: #fff;
}

.colors-picked {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  gap: 15px;
}

.color-button {
  -webkit-appearance: none;
  cursor: pointer;
  border: 1px solid white;
  border-radius: 5px;
  width: 22px;
  height: 22px;

  &:checked {
    outline: 1px solid white;
    border: 1px solid white;
  }
}

.colors-info {
  font-size: small;
  display: flex;
  flex-direction: column;
  align-items: center;
  color: #fff;
  gap: 10px;
}

.color-parameters {
  border-radius: 5px;
  width: 80%;
  display: flex;
  margin-top: 10px; 
  justify-content: space-evenly;
}

.color-param {
  text-align: center;
}

.color-parameter {
  margin-top: 10px;
}

.contrast {
  border: 1px solid white;
  text-align: center;
  margin-top: 10px;
}

.tooltip {
  position: absolute;
  background-color: #fff;
  color: grey;
  border: solid 1px;
  border-radius: 3px;
  padding: 2px;
  left: 10%;
  transform: translateX(-10%);
  z-index: 999;
}

.colors-table {
  display: flex;
  justify-content: space-between;
  width: 100%;
}

.colors-table-info {
  display: flex;
  flex-direction: column;
  width: 100%;
  align-items: center;
}
</style>
