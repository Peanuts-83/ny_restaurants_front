import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InfiniteSelectComponent } from './infinite-select.component';

describe('InfiniteSelectComponent', () => {
  let component: InfiniteSelectComponent;
  let fixture: ComponentFixture<InfiniteSelectComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InfiniteSelectComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(InfiniteSelectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
