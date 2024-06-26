<!-- Represents a single memory card in the memory game used
in MemoryGamePage. Insert this component into MemoryCardsGrid -->

<template>
  <div
    class="memory-card"
    :class="{ 'flipped': !isFlipped }"
    @click="toggle"
  >
    <div class="card-inner">
      <div
        class="card-front"
        :style="{ backgroundImage: `url(${frontImage})` }"
      />
      <div
        class="card-back"
        :style="{ backgroundImage: `url(${backImage})` }"
      />
    </div>
  </div>
</template>

<script>
import { useGameStore } from '@/stores/gameStore';

export default {
  name: 'MemoryCard',
  props: {
    item: {
      type: Object,
      required: true
    },
    frontImage: {
      type: String,
      required: true
    },
    backImage: {
      type: String,
      required: true
    }
  },
  emits: ['select-item'],
  data() {
    return {
      isFlipped: true,
      isFound: false,
      canSelectAfterWinning: false,
    };
  },
  computed: {
    gameStore() {
      return useGameStore();
    },
    gameState() {
      return this.gameStore.gameState;
    }
  },
  watch: {
    gameState(newVal, oldVal) {
      if (newVal === 'memorize' || newVal === 'finished') {
        this.flip(false); // Show frontImage
      } else if (newVal === 'play') {
        this.flip(true); // Show backImage
      } else {
        this.flip(true); // Default to showing backImage
      }

      if (newVal === 'finished' && oldVal !== 'finished') {
        this.canSelectAfterWinning = false;
        setTimeout(() => {
          this.canSelectAfterWinning = true;
        }, 3000); // 3s delay
      }
    }
  },
  methods: {
    toggle() {
      const currentGameState = this.gameStore.gameState;

      if (currentGameState === 'play' && this.gameStore.playTimer !== null) {
        if (this.isFound || this.gameStore.onCooldown) {
          return;
        }
        this.isFlipped = !this.isFlipped;
        this.gameStore.startCooldown(1300);

        if (this.gameStore.targetItem === this.item) {
          this.isFound = true;
          console.log('Correct item!');
          this.gameStore.guessItem(this.item);
          this.gameStore.setTargetItem();
        } else {
          setTimeout(() => {
            this.isFlipped = true;
          }, 1500);
        }
      } else if (currentGameState === 'finished' && this.canSelectAfterWinning) {
        this.$emit('select-item', this.item);
      }
    },
    flip(showBack) {
      this.isFlipped = showBack;
    },
  }
};
</script>

<style scoped>
.memory-card {
  @apply w-full h-full;
  perspective: 1000px;
}

.card-inner {
  width: 100%;
  height: 100%;
  transition: transform 0.6s;
  transform-style: preserve-3d;
  position: relative;
  transform: rotateY(180deg);
  /* Default to showing back */
}

.memory-card.flipped .card-inner {
  transform: rotateY(0deg);
  /* Flip to show front */
}

.card-front,
.card-back {
  position: absolute;
  width: 100%;
  height: 100%;
  backface-visibility: hidden;
  background-size: cover;
  background-position: center;
}

.card-front {

  transform: rotateY(0deg);
}

.card-back {
  transform: rotateY(180deg);
}
</style>
