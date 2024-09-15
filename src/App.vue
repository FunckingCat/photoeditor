<template>
  <div class="app-container">
    <router-view />
  </div>
</template>

<script>
export default {
  name: "App",
};
</script>

<style>
@import "./styles/reset.css";

* {
  margin: 0;
  padding: 0;
  border: 0;
}
.app-container {
  height: 100vh;
  width: 100vw;
}
</style>
