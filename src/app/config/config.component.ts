import { Component, Inject, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatInput } from '@angular/material/input';

export interface Config {
  selectedMusicTheme: 'A' | 'B' | 'C' | null;
  selectedDisplayTheme: 'dark' | 'bright';
  userName?: string;
}

@Component({
  selector: 'app-config',
  templateUrl: './config.component.html',
  styleUrls: ['./config.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class ConfigComponent implements OnInit {
  @ViewChild('nameInput', { static: true }) nameInput: MatInput;

  constructor(@Inject(MAT_DIALOG_DATA) public data: Config, public ref: MatDialogRef<ConfigComponent>) {}

  ngOnInit(): void {
    const name = localStorage.getItem('userName');
    this.nameInput.value = name || 'Anonymous';
  }

  setName() {
    this.data.userName = this.nameInput.value;
    localStorage.setItem('userName', this.nameInput.value);
  }

  close() {
    this.ref.close();
  }

  save() {
    this.ref.close(this.data);
  }
}
