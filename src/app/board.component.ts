import { AfterViewInit, Component, ElementRef, HostListener, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Zoundfx } from 'ng-zzfx';
import { Config, ConfigComponent } from './config/config.component';
import {
  BLOCK_SIZE,
  COLORS,
  COLORSDARKER,
  COLORSLIGHTER,
  COLS,
  HighScore,
  KEY,
  LEVEL,
  LINES_PER_LEVEL,
  POINTS,
  ROWS,
} from './constants';
import { GameService } from './game.service';
import { HighScoresComponent } from './high-scores/high-scores.component';
import { IPiece, Piece } from './piece.component';

@Component({
  selector: 'game-board',
  templateUrl: 'board.component.html',
})
export class BoardComponent implements AfterViewInit {
  @ViewChild('board', { static: true }) canvas: ElementRef<HTMLCanvasElement>;
  @ViewChild('next', { static: true })
  canvasNext: ElementRef<HTMLCanvasElement>;
  @ViewChild('audioA') set a(ref: ElementRef<HTMLAudioElement>) {
    ref.nativeElement.loop = true;
    this.audio.A = ref.nativeElement;
  }

  @ViewChild('audioB') set b(ref: ElementRef<HTMLAudioElement>) {
    ref.nativeElement.loop = true;
    this.audio.B = ref.nativeElement;
  }
  @ViewChild('audioC') set c(ref: ElementRef<HTMLAudioElement>) {
    ref.nativeElement.loop = true;
    this.audio.C = ref.nativeElement;
  }
  @ViewChild('parent') wrapper: ElementRef;

  config: Config = { selectedMusicTheme: 'B', selectedDisplayTheme: 'dark' };

  audio: {
    A?: HTMLAudioElement;
    B?: HTMLAudioElement;
    C?: HTMLAudioElement;
  } = {};
  ctx: CanvasRenderingContext2D;
  ctxNext: CanvasRenderingContext2D;
  board: number[][];
  piece: Piece;
  next: Piece;
  requestId: number;
  paused: boolean;
  gameStarted: boolean;
  time: { start: number; elapsed: number; level: number };
  points: number;
  highScore: number;
  lines: number;
  level: number;
  highScores: HighScore[];
  moves = {
    [KEY.LEFT]: (p: IPiece): IPiece => ({ ...p, x: p.x - 1 }),
    [KEY.RIGHT]: (p: IPiece): IPiece => ({ ...p, x: p.x + 1 }),
    [KEY.DOWN]: (p: IPiece): IPiece => ({ ...p, y: p.y + 1 }),
    [KEY.SPACE]: (p: IPiece): IPiece => ({ ...p, y: p.y + 1 }),
    [KEY.UP]: (p: IPiece): IPiece => this.service.rotate(p),
  };
  playSoundFn: Function;

  @HostListener('window:keydown', ['$event'])
  keyEvent(event: KeyboardEvent) {
    this.move(event.keyCode, event);
  }

  move(keyCode, event?) {
    if (keyCode === KEY.ESC) {
      this.gameOver();
    } else if (this.moves[keyCode]) {
      event?.preventDefault();
      // Get new state
      let p = this.moves[keyCode](this.piece);
      if (keyCode === KEY.SPACE) {
        // Hard drop
        while (this.service.valid(p, this.board)) {
          this.points += POINTS.HARD_DROP;
          this.piece.move(p);
          p = this.moves[KEY.DOWN](this.piece);
        }
      } else if (this.service.valid(p, this.board)) {
        this.piece.move(p);
        if (keyCode === KEY.DOWN) {
          this.points += POINTS.SOFT_DROP;
        }
      }
    }
  }

  constructor(private service: GameService, private dialog: MatDialog) {}

  ngAfterViewInit() {
    this.initBoard();
    this.initHighScores();
    this.initUserName();
    this.initSound();
    this.initNext();
    this.resetGame();
    this.highScore = 0;
  }

  initSound() {
    this.playSoundFn = Zoundfx.start(0.2);
  }

  initUserName() {
    const name = localStorage.getItem('userName');
    this.config.userName = name || ' Anonymous';
  }

  initHighScores() {
    const scores: string = localStorage.getItem('highScores');
    let highscores: HighScore[] = scores ? JSON.parse(scores) : [];
    highscores = highscores.sort((a, b) => (b?.points || 0) - (a.points || 0)).filter((x) => x?.points && x?.name);
    localStorage.setItem('highScores', JSON.stringify(highscores));
    this.highScores = highscores;
  }

  setHighScore() {
    this.highScores.push({
      date: new Date().toLocaleDateString(),
      points: this.points,
      level: this.level,
      name: this.config.userName || '',
    });
    localStorage.setItem('highScores', JSON.stringify(this.highScores));
  }

  get highestScore() {
    return !this.highScores?.length ? 0 : Math.max(...this.highScores?.map((x) => x?.points).filter((x) => x));
  }

  blockSize;
  initBoard() {
    this.ctx = this.canvas.nativeElement.getContext('2d');

    const height = (this.wrapper.nativeElement as HTMLDivElement).getBoundingClientRect().height - 130;
    const width = (this.wrapper.nativeElement as HTMLDivElement).getBoundingClientRect().width;

    this.blockSize = Math.min(width / COLS, height / ROWS);

    // Calculate size of canvas from constants.
    this.ctx.canvas.width = COLS * this.blockSize;
    this.ctx.canvas.height = ROWS * this.blockSize;

    // Scale so we don't need to give size on every draw.
    this.ctx.scale(this.blockSize, this.blockSize);
  }

  initNext() {
    this.ctxNext = this.canvasNext.nativeElement.getContext('2d');

    const blockSize = Math.min(this.blockSize, BLOCK_SIZE);
    // Calculate size of canvas from constants.
    // The + 2 is to allow for space to add the drop shadow to
    // the "next piece"
    this.ctxNext.canvas.width = 4 * blockSize + 2;
    this.ctxNext.canvas.height = 4 * blockSize;

    this.ctxNext.scale(blockSize, blockSize);
  }

  play() {
    this.resetGame();
    this.gameStarted = true;
    this.next = new Piece(this.ctx);
    this.piece = new Piece(this.ctx);
    this.next.drawNext(this.ctxNext);
    this.time.start = performance.now();

    // If we have an old game running a game then cancel the old
    if (this.requestId) {
      cancelAnimationFrame(this.requestId);
    }

    this.animate();
    if (this.config.selectedMusicTheme) {
      this.audio[this.config.selectedMusicTheme].muted = false;
      this.audio[this.config.selectedMusicTheme].play();
      this.audio[this.config.selectedMusicTheme].volume = 1;
    }
  }
  /* 
  themeChanged(theme: 'A' | 'B' | 'C') {
    this.selectedTheme = theme;
    ['A', 'B', 'C'].forEach((k) => (this.audio[k].currentTime = 0));
  } */

  resetGame() {
    this.gameStarted ? this.setHighScore() : false;
    this.points = 0;
    this.lines = 0;
    this.level = 0;
    this.board = this.getEmptyBoard();
    this.time = { start: 0, elapsed: 0, level: LEVEL[this.level] };
    this.paused = false;
    this.addOutlines();
  }

  showHighscores() {
    if (this.highScores?.length) {
      this.dialog.open(HighScoresComponent, {
        data: this.highScores,
        maxWidth: '80vw',
        maxHeight: '80vh',
        panelClass: 'high-scores',
      });
    }
  }

  animate(now = 0) {
    this.time.elapsed = now - this.time.start;
    if (this.time.elapsed > this.time.level) {
      this.time.start = now;
      if (!this.drop()) {
        this.gameOver();
        return;
      }
    }
    this.draw();
    this.requestId = requestAnimationFrame(this.animate.bind(this));
  }

  draw() {
    this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    this.piece.draw();
    this.drawBoard();
  }

  drop(): boolean {
    let p = this.moves[KEY.DOWN](this.piece);
    if (this.service.valid(p, this.board)) {
      this.piece.move(p);
    } else {
      this.freeze();
      this.clearLines();
      if (this.piece.y === 0) {
        // Game over
        return false;
      }
      this.playSoundFn([, , 224, 0.02, 0.02, 0.08, 1, 1.7, -13.9, , , , , , 6.7]);
      this.piece = this.next;
      this.next = new Piece(this.ctx);
      this.next.drawNext(this.ctxNext);
    }
    return true;
  }

  clearLines() {
    let lines = 0;
    this.board.forEach((row, y) => {
      if (row.every((value) => value !== 0)) {
        lines++;
        this.board.splice(y, 1);
        this.board.unshift(Array(COLS).fill(0));
      }
    });
    if (lines > 0) {
      this.points += this.service.getLinesClearedPoints(lines, this.level);
      this.lines += lines;
      if (this.lines >= LINES_PER_LEVEL) {
        this.level++;
        this.lines -= LINES_PER_LEVEL;
        this.time.level = LEVEL[this.level];
      }
    }
  }

  freeze() {
    this.piece.shape.forEach((row, y) => {
      row.forEach((value, x) => {
        if (value > 0) {
          this.board[y + this.piece.y][x + this.piece.x] = value;
        }
      });
    });
  }

  private add3D(x: number, y: number, color: number): void {
    //Darker Color
    this.ctx.fillStyle = COLORSDARKER[color];
    // Vertical
    this.ctx.fillRect(x + 0.9, y, 0.1, 1);
    // Horizontal
    this.ctx.fillRect(x, y + 0.9, 1, 0.1);

    //Darker Color - Inner
    // Vertical
    this.ctx.fillRect(x + 0.65, y + 0.3, 0.05, 0.3);
    // Horizontal
    this.ctx.fillRect(x + 0.3, y + 0.6, 0.4, 0.05);

    // Lighter Color - Outer
    this.ctx.fillStyle = COLORSLIGHTER[color];

    // Lighter Color - Inner
    // Vertical
    this.ctx.fillRect(x + 0.3, y + 0.3, 0.05, 0.3);
    // Horizontal
    this.ctx.fillRect(x + 0.3, y + 0.3, 0.4, 0.05);

    // Lighter Color - Outer
    // Vertical
    this.ctx.fillRect(x, y, 0.05, 1);
    this.ctx.fillRect(x, y, 0.1, 0.95);
    // Horizontal
    this.ctx.fillRect(x, y, 1, 0.05);
    this.ctx.fillRect(x, y, 0.95, 0.1);
  }

  private addOutlines() {
    for (let index = 1; index < COLS; index++) {
      this.ctx.fillStyle = 'black';
      this.ctx.fillRect(index, 0, 0.025, this.ctx.canvas.height);
    }

    for (let index = 1; index < ROWS; index++) {
      this.ctx.fillStyle = 'black';
      this.ctx.fillRect(0, index, this.ctx.canvas.width, 0.025);
    }
  }

  drawBoard() {
    this.board.forEach((row, y) => {
      row.forEach((value, x) => {
        if (value > 0) {
          this.ctx.fillStyle = COLORS[value];
          this.ctx.fillRect(x, y, 1, 1);
          this.add3D(x, y, value);
        }
      });
    });
    this.addOutlines();
  }

  pause() {
    if (this.gameStarted) {
      if (this.paused) {
        this.animate();
        this.audio[this.config.selectedMusicTheme].muted = false;
        this.audio[this.config.selectedMusicTheme]?.play();
      } else {
        this.ctx.font = '1px Arial';
        this.ctx.fillStyle = 'black';
        this.ctx.fillText('GAME PAUSED', 1.4, 4);
        cancelAnimationFrame(this.requestId);
        this.audio[this.config.selectedMusicTheme]?.pause();
      }

      this.paused = !this.paused;
    }
  }

  openConfig() {
    const copy = JSON.parse(JSON.stringify(this.config));
    this.dialog
      .open(ConfigComponent, { data: this.config, panelClass: 'config', disableClose: true })
      .afterClosed()
      .subscribe((x) => {
        if (!x) {
          this.config = copy;
        } else {
          if (this.config.selectedMusicTheme != copy.selectedMusicTheme) {
            ['A', 'B', 'C'].forEach((k) => (this.audio[k].currentTime = 0));
          }
        }
      });
  }

  gameOver() {
    if (this.config.selectedMusicTheme) {
      this.audio[this.config.selectedMusicTheme].pause();
      this.audio[this.config.selectedMusicTheme].currentTime = 0;
    }
    this.setHighScore();
    this.gameStarted = false;
    cancelAnimationFrame(this.requestId);
    this.highScore = this.points > this.highScore ? this.points : this.highScore;
    this.ctx.fillStyle = 'black';
    this.ctx.fillRect(1, 3, 8, 1.2);
    this.ctx.font = '1px Arial';
    this.ctx.fillStyle = 'red';
    this.ctx.fillText('GAME OVER', 1.8, 4);
  }

  getEmptyBoard(): number[][] {
    return Array.from({ length: ROWS }, () => Array(COLS).fill(0));
  }
}
