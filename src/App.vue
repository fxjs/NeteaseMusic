<template>
  <div id="app" :class="`mode-${mode}`">
    <img src="./assets/img/bg-1.png" alt="" class="app-bg">
    <img id="play-music-bg" alt="">
    <canvas :width="pageWidth" :height="pageHeight" id="music-data-canvas" ></canvas>
    <div class="main-container">
      <div style="display: inline-block;width: 60%;" v-if="showCover">
        <Playing />
      </div>
      <router-view />
      <PageLeft />
      <Player />
      <Operation />
    </div>
  </div>
</template>

<script>
  import Storage from './assets/utils/Storage';
  import Player from './components/Player';
  import PageLeft from './components/PageLeft';
  import Playing from './components/Playing';
  import Operation from './components/Operation';
  import { loginStatus } from './assets/utils/request';
  import { messageHelp } from "./assets/utils/util";
  import { mapGetters } from 'vuex';

  export default {
    name: 'App',
    components: { Player, PageLeft, Playing, Operation },
    data() {
      return {
        defaultActive: '/',
        pageWidth: 0,
        pageHeight: 0,
      }
    },
    computed: {
      ...mapGetters({
        allSongs: 'getAllSongs',
        showCover: 'isShowCoverImg',
        mode: 'getMode',
      })
    },
    created() {
      window.VUE_APP = this;
      window.QUERY_QQ_TIMES = 1;
      loginStatus();

      if(/Android|webOS|iPhone|iPod|BlackBerry/i.test(navigator.userAgent)) {
        this.$store.dispatch('updateMode', 'mobile');
      }

      // 播放顺序，qq号的一些配置
      if (!Storage.get('orderType')) {
        Storage.set('orderType', 'liebiao');
      }
      this.defaultActive = window.location.hash.split('/')[1];

      Storage.setDefault({
        listen_size: 'size320',
        down_size: 'high',
        down_high: 'sizeflac',
        volume: 1,
        download_info: JSON.stringify({
          count: 0,
          list: [],
        }),
        key_code_map: JSON.stringify({
          PLAY_NEXT: '39',
          PLAY_PREV: '37',
          VOLUME_UP: '38',
          VOLUME_DOWN: '40',
          PLAY: '32',
          QUIT_SIMPLE: '27',
          TO_SIMPLE: ''
        })
      });

      // 初始化一下下载记录
      const downList = Storage.get('down_list_info', true, '[]');
      downList.forEach((item) => {
        // 一般是之前没有下载完就关掉了页面
        if (item.status !== 'success') {
          item.status = 'abort';
        }
      });
      this.$store.dispatch('updateDownload');

      messageHelp(6);
      messageHelp(7);
    },
    mounted() {
      const canvas = document.getElementById('music-data-canvas');
      const ctx = canvas.getContext('2d');
      this.pageWidth = window.innerWidth;
      this.pageHeight = window.innerHeight;

      this.ctx = ctx;
      ctx.fillStyle = 'yellow';
      ctx.fillRect(100, 100, 100, 100);

      const pDom = document.getElementById('m-player');

      window.onresize = () => {
        this.pageWidth = window.innerWidth;
        this.pageHeight = window.innerHeight;
      };

      const draw = () => {
        const { musicDataMap = { 0: [] }, AnalyserNode, AudioBufferSourceNode } = window;
        const drawMusicType = Storage.get('drawMusicType');
        if (!AnalyserNode || !AnalyserNode.getByteFrequencyData) {
          return;
        }
        let dataArr = new Uint8Array(AnalyserNode.frequencyBinCount);//用于存放音频数据的数组，其长度是fftsize的一半
        AnalyserNode.getByteFrequencyData(dataArr);// 将音频频域数据复制到传入的Uint8Array数组

        if (drawMusicType === '2') {
          dataArr = [ ...dataArr.reverse(), ...dataArr.reverse() ].filter((v, i) => i % 2);
        }
        musicDataMap[AudioBufferSourceNode.context.currentTime] = [...dataArr];


        const keys = Object.keys(musicDataMap);
        let index = keys.findIndex((v) => v >= pDom.currentTime);
        if (index <= 0) {
          index = 0;
        }

        const arr = musicDataMap[keys[index]];
        const { ctx } = this;
        const { pageWidth, pageHeight } = this;
        ctx.clearRect(0, 0, pageWidth, pageHeight);
        const num = (Storage.get('drawMusicNum') || 64);
        if (arr) {
          arr.forEach((v, i) => {
            const linearGradient= ctx.createLinearGradient(
              pageWidth * i / num,
              pageHeight,
              pageWidth * i / num,
              pageHeight / 2,
            );
            linearGradient.addColorStop(0,"#409EFF33");
            linearGradient.addColorStop(1,"#5cB87a33");
            ctx.fillStyle = linearGradient;
            ctx.fillRect(
              pageWidth * i / num,
              pageHeight - 80 - v / 256 * pageHeight / 2,
              pageWidth * 0.9 / num,
              v / 256 * pageHeight / 2
            );
          })
        }
      };

      if (Storage.get('showDrawMusic') !== '0') {
        setInterval(draw, 1000 / 60);
      }
    },
    methods: {

    }
  }
</script>

<style lang="scss">
  @import "assets/style/common";
  body {
    overflow: hidden;
  }
  a {
    color: #fffc;
  }
  .hide-scroll {
    overflow-y: auto;

    &::-webkit-scrollbar {
      width: 0;
      height:8px;
      background-color:rgba(0,0,0,0);
    }
  }
  #app {
    height: 100vh;
    min-width: 1200px;

    #music-data-canvas {
      position: absolute;
      z-index: -1;
      top: 0;
      left: 0;
    }

    #play-music-bg {
      position: absolute;
      z-index: -5;
      left: -5vw;
      min-width: 110vw;
      min-height: 110vh;
      bottom: -30%;
      -webkit-filter: blur(50px) brightness(60%);
      -moz-filter: blur(50px) brightness(60%);
      -o-filter: blur(50px) brightness(60%);
      -ms-filter: blur(50px) brightness(60%);
      filter: blur(50px) brightness(60%);
    }

    .app-bg {
      position: relative;
      z-index: -10;
      top: 0;
      left: 0;
      min-width: 100vw;
      min-height: 100vh;
    }

    .main-container {
      position: absolute;
      overflow-y: auto;
      overflow-x: hidden;
      min-width: 1200px;
      height: calc(100vh - 80px);
      top: 0;
      left: 0;
      display: inline-block;
      vertical-align: top;
      padding: 20px 20px 0 20px;
      width: 100%;
      box-sizing: border-box;

      &::-webkit-scrollbar
      {
        width:8px;
        height:8px;
        background-color:rgba(0,0,0,0);
      }
      /*定义滚动条轨道
       内阴影+圆角*/
      &::-webkit-scrollbar-track
      {
        border-radius:10px;
        background-color: rgba(255,255,255,0.1);
      }
      /*定义滑块
       内阴影+圆角*/
      &::-webkit-scrollbar-thumb
      {
        border-radius:10px;
        background-color:rgba(255,255,255,0.5);
      }
    }

    .playing-bg {
      position: absolute;
      height: 76px;
      top: -3px;

      .wave-bg {
        width: 60vw;
        height: 60vw;
        border-radius: 35%;
        position: absolute;
        right: 0;
        top: -30vw;
        animation: waveBg 5s infinite linear;
        background: -webkit-linear-gradient(left, #409EFF33, #409EFF99);
      }
      .wave-bg2 {
        width: 80vw;
        height: 80vw;
        border-radius: 45%;
        position: absolute;
        right: 0;
        top: -40vw;
        animation: waveBg 8s infinite linear;
        background: -webkit-linear-gradient(top, #fff1, #fff2);
      }

      @keyframes waveBg {
        from {
          transform: rotate(0);
        }
        to {
          transform: rotate(360deg);
        }
      }
    }
  }

  /* 部分页面的右侧导航 */
  .right-select-tab-list {
    position: absolute;
    left: -120px;
    color: #fff;

    @for $i from 0 to 5 {
      .tab-item-#{$i} {
        position: absolute;
        white-space: nowrap;
        overflow: hidden;
        right: -120px;
        top: #{$i * 45 + 15}px;
        width: 40px;
        padding: 5px;
        float: right;
        transition: 0.3s linear;
        box-sizing: border-box;
        box-shadow: -5px 5px 5px #0003;

        .iconfont {
          margin-right: 10px;
          transition: 0.3s linear;
        }
      }
    }

    $color: (
      red: #F56C6C,
      blue: #409EFF,
      green: #67C23A,
      yellow: #E6A23C,
      gray: #666666,
    );

    .c-gray:hover {
      color: #fff8 !important;
      .iconfont {
        color: #fff8 !important;
      }
    }

    @each $c,$v in $color {
      .c-#{$c} {
        background: #0001;
        border-left: 5px solid #{$v}33;

        &:hover {
          background: #0001;
          width: 120px;
          cursor: pointer;
          color: #{$v}cc;

          &.selected {
            .iconfont {
              color: #{$v}cc;
            }
          }
          .iconfont {
            color: #{$v}cc;
          }
        }

        &.selected {
          background: #{$v}33;
        }
      }
    }
  }
</style>
