import { HighScore } from './../constants';
import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-high-scores',
  templateUrl: './high-scores.component.html',
  styleUrls: ['./high-scores.component.css'],
})
export class HighScoresComponent implements OnInit {
  constructor(@Inject(MAT_DIALOG_DATA) public data: HighScore[], public ref: MatDialogRef<HighScoresComponent>) {}

  ngOnInit(): void {}
}
