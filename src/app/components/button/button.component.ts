import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-button',
  standalone: true,
  imports: [],
  templateUrl: './button.component.html',
  styleUrls: ['./button.component.scss'],
})
export class ButtonComponent {
    @Input() label = '';
    @Input() isDisabled = false;
    @Output() onClick = new EventEmitter<any>();

    constructor() {}
    ngOnInit() {}

    onClickButton(event: any) {
        this.onClick.emit(event);
    }
}
