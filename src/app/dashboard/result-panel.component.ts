import { Component, input } from '@angular/core';

@Component({
  selector: 'app-result-panel',
  standalone: true,
  templateUrl: './result-panel.component.html',
  styleUrl: './result-panel.component.scss',
})
export class ResultPanelComponent {
  result = input<string>('');
}
