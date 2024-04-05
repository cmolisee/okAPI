import { Component } from '@angular/core';
import { ButtonComponent } from './components/button/button.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  title='okAPI';
  buttonLabel='testy button';
  isButtonDisabled=false;
  
  functioncall(event: any) {
    console.log('functioncall', event);
  }

  clickHandler(event: any) {
    console.log('clickHandler', event);
  }
}
