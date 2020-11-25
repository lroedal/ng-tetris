import { Component } from "@angular/core";

@Component({
  selector: "app-root",
  template: ` <game-board></game-board> `,
})
export class AppComponent {
  title = "ng-tetris";
  // theme a - https://commons.wikimedia.org/wiki/File:Tetris_theme.ogg
  // theme b - https://soundcloud.com/b4ssfreq/tetris-remix-final
  // theme c - https://www.youtube.com/watch?v=ozea4GO-Hrg
}
