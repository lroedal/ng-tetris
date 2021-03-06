import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { HighScore } from './../constants';

@Component({
  template: `<div
    style="
    background: var(--secondary-background);
    border-radius: 4px;
    color: var(--secondary-background-contrast);
    display: grid;
    height: calc(100% - 60px);
    padding: 20px;
    row-gap: 20px;
    grid-template-rows: 1fr 40px;
  "
  >
    <ul style="list-style-type: none; margin: 0; padding: 0">
      <li style="margin-bottom: 20px; border-bottom: 1px solid var(--secondary-background-contrast)">
        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; column-gap: 20px; row-gap: 5px; width: 100%">
          <span>Name</span>
          <span>Date</span>
          <span style="text-align: right">Level</span>
          <span style="text-align: right">Points</span>
        </div>
      </li>
      <li>
        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; column-gap: 20px; row-gap: 5px; width: 100%">
          <ng-container *ngFor="let highScore of data">
            <span>{{ highScore?.name }}</span>
            <span>{{ highScore?.date }}</span>
            <span style="text-align: right">{{ highScore?.level }}</span>
            <span style="text-align: right">{{ highScore?.points }}</span>
          </ng-container>
        </div>
      </li>
    </ul>

    <div style="display: flex; justify-content: flex-end">
      <button mat-flat-button mat-dialog-cose class="button" (click)="ref?.close()">Close</button>
    </div>
  </div> `,
})
export class HighScoresComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public data: HighScore[], public ref: MatDialogRef<HighScoresComponent>) {}
}
