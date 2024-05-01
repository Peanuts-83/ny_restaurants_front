import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms'

@Component({
  selector: 'app-nav',
  templateUrl: './nav.component.html',
  styleUrls: ['./nav.component.less']
})
export class NavComponent implements OnInit {
  searchForm!: FormGroup

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
      this.searchForm = this.fb.group({
        restaurant: [''],
        rest_exact: [false], // checkbox pour une requete exacte sur le string restaurant
        borough: [''],
        distance: [null, Validators.pattern('^[0-9]+$')], // depuis la position de user
        cuisine: [''],
        grades: this.fb.group({
          A: [false],
          B: [false],
          C: [false],
          D: [false],
          E: [false],
          F: [false],
          Other: [false],
        })
      })
  }

  public onSubmit() {

  }
}
