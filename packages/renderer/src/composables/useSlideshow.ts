import { ref } from "vue";

export function useSlideshow(interval = 3000) {
  const playing = ref(false);
  let timer: ReturnType<typeof setInterval> | null = null;

  function start(onNext: () => void) {
    stop();
    timer = setInterval(onNext, interval);
  }

  function stop() {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  }

  return { playing, start, stop };
}
