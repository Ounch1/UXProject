<!-- Handles the state of the memory card and displays
either front or back image-->

<template>
  <div
    class="memory-card flex items-center justify-center h-full w-full object-cover bg-cover bg-center"
    :class="{ 'cursor-pointer': gameState === 'play' }"
    :style="{ backgroundImage: `url(${isFlipped ? backImage : frontImage})` }"
    @click="toggle"
  />
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
        isFlipped: false,
        isFound: false
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
      gameState(newVal) {
        if (newVal === 'play') {
          this.flip(true);
        } else {
          this.flip(false);
        }
      }
    },
    methods: {
    toggle() {
        const currentGameState = useGameStore().gameState;

        if (this.isFound === true || this.gameStore.onCooldown === true) {
          return;
        }

        if (currentGameState === 'play' && this.gameStore.playTimer !== null) {
            this.isFlipped = !this.isFlipped;

            this.gameStore.startCooldown(1500);

            if (this.gameStore.targetItem === this.item) {
              this.isFound = true;
              console.log('Correct item!');
              this.gameStore.guessItem(this.item);
              this.gameStore.setTargetItem();
            }
            else {
              setTimeout(() => {
                this.flip(true);
              }, 1500);
            }

            
        } else if (currentGameState === 'finished') {
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
    transition: transform 0.6s;
    transform-style: preserve-3d;
  }
  .item-thumbnail {
    backface-visibility: hidden;
  }
  </style>
  

  