/* Pure game rules, shared by the browser and Node tests. */
(function (root) {
  'use strict';
  const SHAPES = {
    I: [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]],
    O: [[1,1],[1,1]], T: [[0,1,0],[1,1,1],[0,0,0]],
    S: [[0,1,1],[1,1,0],[0,0,0]], Z: [[1,1,0],[0,1,1],[0,0,0]],
    J: [[1,0,0],[1,1,1],[0,0,0]], L: [[0,0,1],[1,1,1],[0,0,0]]
  };
  const COLORS = { I:'#67d9ed', O:'#f6d46c', T:'#b5a0ff', S:'#b7e976', Z:'#f1859c', J:'#6c9df1', L:'#f4ac72' };
  class Game {
    constructor(mode = 'arcade', random = Math.random) {
      this.mode = mode; this.random = random; this.board = Array.from({length:20}, () => Array(10).fill(null));
      this.queue = []; this.bag = []; this.score = 0; this.lines = 0; this.level = 1;
      this.held = null; this.canHold = true; this.over = false; this.combo = -1;
      this.fillQueue(); this.spawn();
    }
    fillQueue() {
      while (this.queue.length < 4) {
        if (!this.bag.length) {
          this.bag = Object.keys(SHAPES);
          for (let i=this.bag.length-1;i>0;i--) { const j=Math.floor(this.random()*(i+1)); [this.bag[i],this.bag[j]]=[this.bag[j],this.bag[i]]; }
        }
        this.queue.push(this.bag.pop());
      }
    }
    spawn(type) {
      type = type || this.queue.shift(); this.fillQueue();
      this.piece = {type, cells:SHAPES[type].map(r=>r.slice()), x:type==='O'?4:3, y:0};
      if (this.collides(this.piece)) this.over = true;
    }
    collides(piece, dx=0, dy=0, cells=piece.cells) {
      return cells.some((row,y)=>row.some((cell,x)=> {
        if (!cell) return false;
        const bx=piece.x+x+dx, by=piece.y+y+dy;
        return bx<0 || bx>=10 || by>=20 || (by>=0 && Boolean(this.board[by][bx]));
      }));
    }
    move(dx,dy=0) {
      if (this.over || this.collides(this.piece,dx,dy)) return false;
      this.piece.x+=dx; this.piece.y+=dy; return true;
    }
    rotate(direction=1) {
      if (this.over || this.piece.type==='O') return false;
      const old=this.piece.cells,n=old.length;
      const cells=Array.from({length:n},(_,y)=>Array.from({length:n},(_,x)=>direction>0?old[n-1-x][y]:old[x][n-1-y]));
      // Wall/floor kicks keep rotation forgiving near the board edges.
      for (const [dx,dy] of [[0,0],[-1,0],[1,0],[-2,0],[2,0],[0,-1],[-1,-1],[1,-1],[0,-2]]) {
        if (!this.collides(this.piece,dx,dy,cells)) {this.piece.cells=cells;this.piece.x+=dx;this.piece.y+=dy;return true;}
      }
      return false;
    }
    ghostY() { let y=this.piece.y; while(!this.collides(this.piece,0,y-this.piece.y+1)) y++; return y; }
    softDrop() { if(this.move(0,1)){this.score++;return true;}return false; }
    hardDrop() {
      if(this.over)return {cleared:0};
      const y=this.ghostY();this.score+=(y-this.piece.y)*2;this.piece.y=y;return this.lock();
    }
    hold() {
      if(!this.canHold || this.over)return false;
      const type=this.piece.type;
      if(this.held)this.spawn(this.held);else this.spawn();
      this.held=type;this.canHold=false;return true;
    }
    lock() {
      if(this.over)return {cleared:0};
      let above=false;
      this.piece.cells.forEach((row,y)=>row.forEach((cell,x)=>{if(cell){const by=this.piece.y+y;if(by<0)above=true;else this.board[by][this.piece.x+x]=this.piece.type;}}));
      if(above){this.over=true;return {cleared:0};}
      const clearedRows=[];
      this.board.forEach((row,y)=>{if(row.every(Boolean))clearedRows.push(y);});
      const cleared=clearedRows.length;
      this.board=this.board.filter(row=>!row.every(Boolean));
      while(this.board.length<20)this.board.unshift(Array(10).fill(null));
      this.combo=cleared?this.combo+1:-1;
      const gained=cleared?([0,100,300,500,800][cleared]+Math.max(0,this.combo)*50)*this.level:0;
      this.score+=gained;this.lines+=cleared;this.level=this.mode==='chill'?1:Math.floor(this.lines/10)+1;
      this.canHold=true;this.spawn();return {cleared,clearedRows,gained,combo:this.combo};
    }
    get interval(){return this.mode==='chill'?1000:Math.max(90,850*Math.pow(.8,this.level-1));}
  }
  const api={Game,SHAPES,COLORS};
  if(typeof module!=='undefined' && module.exports)module.exports=api;else root.BlockParty=api;
})(typeof globalThis!=='undefined'?globalThis:this);
