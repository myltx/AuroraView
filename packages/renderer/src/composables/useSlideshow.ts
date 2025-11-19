import { ref } from "vue";

export function useSlideshow(count: number) {
  const playing = ref(false);
  let timer: any;

  function start(onNext: () => void) {
    timer = setInterval(() => onNext(), 3000);
  }
  function stop() {
    clearInterval(timer);
  }
  return { playing, start, stop };
}
