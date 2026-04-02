<template>
  <Transition name="overlay">
    <div v-show="visible" class="overlay">
      <div class="loader-logo">
        <img :src="LOGO_URL" alt="GarantíaYa" class="logo-img" />
        <div class="loader-brand">GarantíaYa</div>
        <div class="loader-sub">Mapa Comercial</div>
      </div>
      <div class="loader-dots">
        <div class="loader-dot"></div>
        <div class="loader-dot"></div>
        <div class="loader-dot"></div>
      </div>
      <Transition name="msg-fade" mode="out-in">
        <div :key="message" class="loader-msg">{{ message }}</div>
      </Transition>
    </div>
  </Transition>
</template>

<script setup>
const LOGO_URL = 'https://firebasestorage.googleapis.com/v0/b/storage-files-b4831.appspot.com/o/isologo_color_positivo%20(1).jpg?alt=media&token=ab83edb4-0bc0-42cb-b320-a236cc6d2952'

defineProps({
  visible: { type: Boolean, default: true },
  message: { type: String, default: '' }
})
</script>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  background: var(--bg);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 24px;
  z-index: 9999;
}

.loader-logo {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.logo-img {
  width: 52px;
  height: 52px;
  border-radius: 12px;
  object-fit: contain;
  background: white;
  padding: 4px;
  animation: logoFloat 2s ease-in-out infinite;
}

@keyframes logoFloat {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
}

.loader-brand {
  font-family: 'DM Serif Display', serif;
  font-size: 22px;
  color: var(--text);
  letter-spacing: -.02em;
}

.loader-sub {
  font-size: 12px;
  color: var(--text-muted);
  margin-top: -8px;
  letter-spacing: .04em;
}

.loader-dots {
  display: flex;
  gap: 7px;
  align-items: center;
}

.loader-dot {
  width: 7px;
  height: 7px;
  background: var(--accent);
  border-radius: 50%;
  animation: dotBounce 1.3s ease-in-out infinite;
}
.loader-dot:nth-child(2) { animation-delay: .18s; background: var(--accent2); }
.loader-dot:nth-child(3) { animation-delay: .36s; background: var(--gold); }

@keyframes dotBounce {
  0%, 80%, 100% { transform: scale(.55); opacity: .35; }
  40% { transform: scale(1); opacity: 1; }
}

.loader-msg {
  font-size: 12px;
  color: var(--text-muted);
  min-height: 18px;
}

.msg-fade-enter-active,
.msg-fade-leave-active {
  transition: opacity .3s ease;
}
.msg-fade-enter-from,
.msg-fade-leave-to {
  opacity: 0;
}

.overlay-enter-active,
.overlay-leave-active {
  transition: opacity .5s ease;
}
.overlay-enter-from,
.overlay-leave-to {
  opacity: 0;
}
</style>
